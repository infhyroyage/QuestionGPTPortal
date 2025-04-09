import {
  AnswerExplanation,
  ChoiceAndSelect,
  Progresses,
  QuestionSelector,
  TestDetail,
  TestDetails,
  TranslationExplanation,
  TranslationSubjectChoice,
} from "@/types/atoms";
import {
  Choice,
  GetAnswer,
  GetQuestion,
  GetTests,
  PostAnswerRes,
  PostProgressReq,
  PutEn2JaReq,
  PutEn2JaRes,
  Subject,
} from "@/types/backend";
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
 * 回答履歴を管理するatom
 */
const progressesAtom = atom<Progresses>(undefined);

/**
 * 問題文・選択肢を管理するatom
 */
const questionSelectorAtom = atom<QuestionSelector>(undefined);

/**
 * テスト詳細情報を管理するatom
 */
const testDetailsAtom = atom<TestDetails>(undefined);

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
    accountInfo: AccountInfo | null,
    isResubmit: boolean = false
  ) => {
    // テスト詳細情報がまだ存在しない場合は何も取得・更新しない
    const testDetails = get(testDetailsAtom);
    if (!testDetails) {
      return;
    }
    const testDetail = testDetails.find(
      (testDetail) => testDetail.testId === testId
    );
    if (!testDetail) {
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
      let correctIdxes: number[];
      let explanations: string[];
      let communityVotes: string[];
      if (isResubmit) {
        // 回答・解説再生成の場合は、まず解説文に対する翻訳文を初期化してから、
        // [POST] /tests/{testId}/answers/{questionNumber}にアクセス
        set(translationExplanationAtom, undefined);
        const postAnswerRes: PostAnswerRes = await accessBackend<PostAnswerRes>(
          "POST",
          `/tests/${testId}/answers/${questionNumber}`,
          instance,
          accountInfo
        );
        correctIdxes = postAnswerRes.correctIdxes;
        explanations = postAnswerRes.explanations;
        communityVotes = postAnswerRes.communityVotes;
      } else {
        // 回答・解説生成の場合は、[GET] /tests/{testId}/answers/{questionNumber}にアクセス
        const getAnswerRes: GetAnswer = await accessBackend<GetAnswer>(
          "GET",
          `/tests/${testId}/answers/${questionNumber}`,
          instance,
          accountInfo
        );
        correctIdxes = getAnswerRes.correctIdxes;
        explanations = getAnswerRes.explanations;
        communityVotes = getAnswerRes.communityVotes;
      }

      // アクセスして取得した正解・解説文で更新
      const correctFlags: boolean[] = [
        ...Array(questionSelector.choices.length),
      ].map((_, idx: number) => correctIdxes.includes(idx));
      set(answerExplanationAtom, {
        correctFlags,
        explanations,
        communityVotes,
        isSubmitting: false,
        isCorrect: selectedFlags.every(
          (selectedFlag, idx) => selectedFlag === correctFlags[idx]
        ),
        correctIdxes,
      });
    } catch (err) {
      // 404エラーの場合は、[POST] /tests/{testId}/answers/{questionNumber}にアクセス
      if (err instanceof AxiosError && err.response?.status === 404) {
        const postAnswerRes: PostAnswerRes = await accessBackend<PostAnswerRes>(
          "POST",
          `/tests/${testId}/answers/${questionNumber}`,
          instance,
          accountInfo
        );

        // アクセスして生成した正解・解説文で更新
        const correctFlags: boolean[] = [
          ...Array(questionSelector.choices.length),
        ].map((_, idx: number) => postAnswerRes.correctIdxes.includes(idx));
        set(answerExplanationAtom, {
          correctFlags,
          explanations: postAnswerRes.explanations,
          communityVotes: postAnswerRes.communityVotes,
          isSubmitting: false,
          isCorrect: selectedFlags.every(
            (selectedFlag, idx) => selectedFlag === correctFlags[idx]
          ),
          correctIdxes: postAnswerRes.correctIdxes,
        });
      } else {
        throw err;
      }
    }
  }
);

/**
 * 回答履歴を取得するatom
 */
export const fetchProgressesAtom = atom(
  (get) => get(progressesAtom),
  async (
    get,
    set,
    testId: string,
    questionNumber: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null
  ) => {
    // 問題文・選択肢がまだ存在しない場合は何も保存しない
    const questionSelector = get(questionSelectorAtom);
    if (!questionSelector) {
      return;
    }

    // 正解・解説文をまだ更新していない場合は何も保存しない
    const answerExplanation = get(answerExplanationAtom);
    if (
      !answerExplanation ||
      answerExplanation.isCorrect === undefined ||
      answerExplanation.correctIdxes === undefined
    ) {
      return;
    }

    // 回答履歴の作成
    const translationSubjectChoice = get(translationSubjectChoiceAtom);
    const history: PostProgressReq = {
      isCorrect: answerExplanation.isCorrect,
      choiceSentences: questionSelector.choices.map(
        (choice) => choice.sentence
      ),
      choiceImgs: questionSelector.choices.map((choice) => choice.img),
      choiceTranslations:
        translationSubjectChoice && translationSubjectChoice.choices,
      selectedIdxes: questionSelector.choices.reduce<number[]>(
        (prev: number[], choice: ChoiceAndSelect, idx: number) => {
          if (choice.isSelected) {
            prev.push(idx);
          }
          return prev;
        },
        []
      ),
      correctIdxes: answerExplanation.correctIdxes,
    };

    // 回答履歴をバックエンドに保存してから更新
    await accessBackend<void, PostProgressReq>(
      "POST",
      `/tests/${testId}/progresses/${questionNumber}`,
      instance,
      accountInfo,
      history
    );

    set(progressesAtom, [...(get(progressesAtom) || []), history]);
  }
);

/**
 * 問題文・選択肢を取得するatom
 */
export const fetchQuestionSelectorAtom = atom(
  (get) => get(questionSelectorAtom),
  async (
    _,
    set,
    testId: string,
    questionNumber: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null
  ) => {
    // [GET] /tests/{testId}/questions/{questionNumber}にアクセスして取得した問題文で更新
    const res: GetQuestion = await accessBackend<GetQuestion>(
      "GET",
      `/tests/${testId}/questions/${questionNumber}`,
      instance,
      accountInfo
    );
    set(questionSelectorAtom, {
      questionNumber,
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
 * テスト詳細情報を取得するatom
 */
export const fetchTestDetailsAtom = atom(
  (get) => get(testDetailsAtom),
  async (
    _,
    set,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null
  ) => {
    // [GET] /testsにアクセス
    const res: GetTests = await accessBackend<GetTests>(
      "GET",
      `/tests`,
      instance,
      accountInfo
    );

    // テスト詳細情報の組み立て
    const testDetails: TestDetail[] = Object.entries(res).flatMap(
      ([courseName, tests]) =>
        tests.map((test) => ({ courseName, ...test, testId: test.id }))
    );

    set(testDetailsAtom, testDetails);
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
  set(progressesAtom, undefined);
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
