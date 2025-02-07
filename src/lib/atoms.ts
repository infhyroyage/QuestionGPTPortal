import {
  AnswerExplanation,
  ChoiceAndSelect,
  QuestionSelector,
  TestDetails,
  TranslationExplanation,
  TranslationSubjectChoice,
} from "@/types/atoms";
import {
  Choice,
  GetAnswer,
  GetQuestion,
  GetTest,
  PostAnswerReq,
  PostAnswerRes,
  PutEn2JaReq,
  PutEn2JaRes,
  Subject,
} from "@/types/backend";
import { Progress, ProgressTestHistory } from "@/types/storage";
import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { AxiosError } from "axios";
import { atom } from "jotai";
import { accessBackend } from "./backend";

/**
 * 正解・解説文を管理するatom
 */
const answerExplanationAtom = atom<AnswerExplanation>(undefined);

/**
 * ダークモードの場合はtrue、ライトモードの場合はfalseのatom
 * toggleDarkModeAtomで隠蔽するためexportしない
 */
const isDarkModeAtom = atom<boolean>(true);

/**
 * 問題文・選択肢を管理するatom
 */
const questionSelectorAtom = atom<QuestionSelector>(undefined);

/**
 * testId単位のテスト詳細情報を管理するatom
 */
const testDetailsAtom = atom<TestDetails>({});

/**
 * 解説文に対する翻訳文を管理するatom
 */
const translationExplanationAtom = atom<TranslationExplanation>(undefined);

/**
 * 問題文・選択肢に対する翻訳文を管理するatom
 */
const translationSubjectChoiceAtom = atom<TranslationSubjectChoice>(undefined);

/**
 * 正解・解説文を取得するatom
 */
export const fetchAnswerExplanationAtom = atom(
  (get) => get(answerExplanationAtom),
  async (
    get,
    set,
    testId: string,
    questionNumber: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null
  ) => {
    // すでに正解・解説文が存在する場合は何も取得・更新しない
    const answerExplanation = get(answerExplanationAtom);
    if (answerExplanation) {
      return;
    }

    // テスト詳細情報がまだ存在しない場合は何も取得・更新しない
    const testDetails = get(testDetailsAtom);
    if (!testDetails[testId]) {
      return;
    }

    // 問題文・選択肢がまだ存在しない場合は何も取得・更新しない
    const questionSelector = get(questionSelectorAtom);
    if (!questionSelector) {
      return;
    }

    // 選択肢がいずれも選択していない場合は何も取得・更新しない
    const selectedFlags: boolean[] = questionSelector.choices.map(
      (choice: ChoiceAndSelect) => choice.isSelected
    );
    if (selectedFlags.every((flag) => !flag)) {
      return;
    }

    // 回答・解説生成中に更新
    set(answerExplanationAtom, {
      isSubmitting: true,
    });

    try {
      // [GET] /tests/{testId}/answers/{questionNumber}にアクセスして取得した正解・解説文で更新
      const getAnswerRes: GetAnswer = await accessBackend<GetAnswer>(
        "GET",
        `/tests/${testId}/answers/${questionNumber}`,
        instance,
        accountInfo
      );
      const correctFlags: boolean[] = [
        ...Array(questionSelector.choices.length),
      ].map((_, idx: number) => getAnswerRes.correctIdxes.includes(idx));
      const isCorrect: boolean = selectedFlags.every(
        (selectedFlag, idx) => selectedFlag === correctFlags[idx]
      );
      set(answerExplanationAtom, {
        correctFlags,
        explanations: getAnswerRes.explanations,
        isSubmitting: false,
        isCorrect,
      });

      // 回答履歴を作成
      const history: ProgressTestHistory = {
        isCorrect,
        choices: questionSelector.choices.map((choice) => choice.sentence),
        selectedIdxes: questionSelector.choices.reduce<number[]>(
          (prev: number[], choice: ChoiceAndSelect, idx: number) => {
            if (choice.isSelected) {
              prev.push(idx);
            }
            return prev;
          },
          []
        ),
        correctIdxes: getAnswerRes.correctIdxes,
      };

      // テストの回答履歴をローカルストレージに保存
      const progressStr: string | null = localStorage.getItem("progress");
      if (progressStr) {
        const progress: Progress = JSON.parse(progressStr);
        if (progress[testId]) {
          // テスト実績あり＆現テスト2問目以降
          progress[testId].histories.push(history);
          localStorage.setItem("progress", JSON.stringify(progress));
        } else {
          // テスト実績あり＆現テスト1問目
          progress[testId] = {
            testLength: testDetails[testId].length,
            histories: [history],
          };
          localStorage.setItem("progress", JSON.stringify(progress));
        }
      } else {
        // テスト実績なし
        localStorage.setItem(
          "progress",
          JSON.stringify({
            [testId]: {
              testLength: testDetails[testId].length,
              histories: [history],
            },
          })
        );
      }
    } catch (err) {
      // 404エラーの場合は、[POST] /tests/{testId}/answers/{questionNumber}にアクセスして正解・解説文の生成を実行し、
      // 取得した正解・解説文で更新
      if (err instanceof AxiosError && err.response?.status === 404) {
        const postAnswerRes: PostAnswerRes = await accessBackend<
          PostAnswerRes,
          PostAnswerReq
        >(
          "POST",
          `/tests/${testId}/answers/${questionNumber}`,
          instance,
          accountInfo,
          {
            courseName: testDetails[testId].courseName,
            subjects: questionSelector.subjects.map(
              (subject: Subject) => subject.sentence
            ),
            choices: questionSelector.choices.map(
              (choice: Choice) => choice.sentence
            ),
          }
        );

        const correctFlags: boolean[] = [
          ...Array(questionSelector.choices.length),
        ].map((_, idx: number) => postAnswerRes.correctIdxes.includes(idx));
        set(answerExplanationAtom, {
          correctFlags,
          explanations: postAnswerRes.explanations,
          isSubmitting: false,
          isCorrect: selectedFlags.every(
            (selectedFlag, idx) => selectedFlag === correctFlags[idx]
          ),
        });
      } else {
        throw err;
      }
    }
  }
);

/**
 * 問題文・選択肢を取得するatom
 */
export const fetchQuestionSelectorAtom = atom(
  (get) => get(questionSelectorAtom),
  async (
    get,
    set,
    testId: string,
    questionNumber: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null
  ) => {
    // すでに問題文が存在する場合は何も取得・更新しない
    const questionSelector = get(questionSelectorAtom);
    if (questionSelector) {
      return;
    }

    // [GET] /tests/{testId}/questions/{questionNumber}にアクセスして取得した問題文で更新
    const res: GetQuestion = await accessBackend<GetQuestion>(
      "GET",
      `/tests/${testId}/questions/${questionNumber}`,
      instance,
      accountInfo
    );
    set(questionSelectorAtom, {
      subjects: res.subjects,
      choices: res.choices.map((choice: Choice) => ({
        ...choice,
        isSelected: false,
      })),
      isMultiplied: res.isMultiplied,
    });
  }
);

/**
 * testId単位のテスト詳細情報を取得するatom
 */
export const fetchTestDetailsAtom = atom(
  (get) => get(testDetailsAtom),
  async (
    get,
    set,
    testId: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null
  ) => {
    // すでにtestIdのテスト詳細情報が存在する場合は何も取得・更新しない
    const testDetails = get(testDetailsAtom);
    if (testDetails[testId]) {
      return;
    }

    // [GET] /tests/{testId}にアクセスして取得したテスト詳細情報で更新
    const res: GetTest = await accessBackend<GetTest>(
      "GET",
      `/tests/${testId}`,
      instance,
      accountInfo
    );
    set(testDetailsAtom, { ...testDetails, [testId]: res });
  }
);

/**
 * 解説文に対する翻訳文を取得するatom
 */
export const fetchTranslationExplanationAtom = atom(
  (get) => get(translationExplanationAtom),
  async (
    get,
    set,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null
  ) => {
    // すでに翻訳文が存在する場合は何も取得・更新しない
    const translationExplanation = get(translationExplanationAtom);
    if (translationExplanation) {
      return;
    }

    // 翻訳対象の解説文がまだ存在しない場合は何も翻訳しない
    const answerExplanation = get(answerExplanationAtom);
    if (!answerExplanation || !answerExplanation.explanations) {
      return;
    }

    // [GET] /en2jaにアクセスして取得した翻訳文で更新
    const res: PutEn2JaRes = await accessBackend<PutEn2JaRes, PutEn2JaReq>(
      "PUT",
      "/en2ja",
      instance,
      accountInfo,
      answerExplanation.explanations
    );

    set(translationExplanationAtom, { explanations: res });
  }
);

/**
 * 問題文・選択肢に対する翻訳文を取得するatom
 */
export const fetchTranslationSubjectChoiceAtom = atom(
  (get) => get(translationSubjectChoiceAtom),
  async (
    get,
    set,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null
  ) => {
    // すでに翻訳文が存在する場合は何も取得・更新しない
    const translationSubjectChoice = get(translationSubjectChoiceAtom);
    if (translationSubjectChoice) {
      return;
    }

    // 翻訳対象の問題文・選択肢がまだ存在しない場合は何も翻訳しない
    const question = get(questionSelectorAtom);
    if (!question) {
      return;
    }

    // 問題文、選択肢それぞれに対して[PUT] /en2jpにアクセスせず、
    // 問題文→選択肢の順で連結した1つの配列を用いて、翻訳を1回にまとめて行うよう整形する
    const data: PutEn2JaReq = [
      ...question.subjects
        .filter(
          (subject: Subject) =>
            !subject.isEscapedTranslation && !subject.isIndicatedImg
        )
        .map((subject: Subject) => subject.sentence),
      ...question.choices
        .filter((choice: Choice) => !choice.isEscapedTranslation)
        .map((choice: Choice) => choice.sentence),
    ];

    // [PUT] /en2jpにアクセスして問題文・選択肢の翻訳文を取得
    const res: PutEn2JaRes = await accessBackend<PutEn2JaRes, PutEn2JaReq>(
      "PUT",
      "/en2ja",
      instance,
      accountInfo,
      data
    );

    // 取得した翻訳文を問題文、選択肢に対応させるように更新
    const subjects: string[] = question.subjects.map((subject: Subject) =>
      subject.isEscapedTranslation || subject.isIndicatedImg
        ? subject.sentence
        : (res.shift() as string)
    );
    const choices: string[] = question.choices.map((choice: Choice) =>
      choice.isEscapedTranslation ? choice.sentence : (res.shift() as string)
    );
    set(translationSubjectChoiceAtom, { subjects, choices });
  }
);

/**
 * TestQuestionPageのレンダリングで必要なatomをすべて初期値に戻すatom(write only)
 */
export const resetAtomsForTestQuestionAtom = atom(null, (_, set) => {
  set(answerExplanationAtom, undefined);
  set(questionSelectorAtom, undefined);
  set(translationSubjectChoiceAtom, undefined);
  set(translationExplanationAtom, undefined);
});

/**
 * ダークモード化のフラグと、ダークモード切替え用のatom
 */
export const toggleDarkModeAtom = atom(
  (get) => get(isDarkModeAtom),
  (get, set) => {
    const isDarkMode = get(isDarkModeAtom);
    set(isDarkModeAtom, !isDarkMode);
  }
);

/**
 * 選択肢の選択状態の切り替えを管理するatom(write only)
 */
export const toggleSelectedChoiceAtom = atom(null, (get, set, idx: number) => {
  // まだ選択肢を取得していない場合は何もしない
  const questionSelector = get(questionSelectorAtom);
  if (!questionSelector) return;

  // 複数個の回答が存在する場合はidx番目のみ選択状態を反転し、
  // 1つの回答のみが存在する場合はidx番目を選択・idx番目以外を未選択とする
  set(questionSelectorAtom, {
    ...questionSelector,
    choices: questionSelector.choices.map(
      (choice: ChoiceAndSelect, i: number) => ({
        ...choice,
        isSelected: questionSelector.isMultiplied
          ? i === idx
            ? !choice.isSelected
            : choice.isSelected
          : i === idx,
      })
    ),
  });
});
