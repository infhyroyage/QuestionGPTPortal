import {
  QuestionSelector,
  Selector,
  Submit,
  TestDetails,
  TranslationInit,
} from "@/types/atoms";
import {
  Choice,
  GetQuestion,
  GetTest,
  PutEn2JaReq,
  PutEn2JaRes,
  Subject,
} from "@/types/backend";
import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { atom } from "jotai";
import { accessBackend } from "./backend";

/**
 * 回答・解説の生成状態を管理するatom
 */
const submitAtom = atom<Submit>("NOT_ANSWERED");

/**
 * 回答・解説の生成状態を次の状態に更新するatom
 */
export const proceedSubmitAtom = atom(
  (get) => get(submitAtom),
  (get, set) => {
    const submit: Submit = get(submitAtom);
    if (submit === "NOT_ANSWERED") {
      set(submitAtom, "ANSWERING");
    } else if (submit === "ANSWERING") {
      // TODO: 未実装(暫定的に正解とする)
      set(submitAtom, "CORRECT");
    }
  }
);

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
 * 選択肢の選択状態の切り替え(write only)を管理するatom
 */
export const toggleSelectedChoiceAtom = atom(null, (get, set, idx: number) => {
  // まだ選択肢を取得していない場合は何もしない
  const questionSelector = get(questionSelectorAtom);
  if (!questionSelector) return;

  // 複数個の回答が存在する場合はidx番目のみ選択状態を反転し、
  // 1つの回答のみが存在する場合はidx番目を選択・idx番目以外を未選択とする
  set(questionSelectorAtom, {
    ...questionSelector,
    choices: questionSelector.choices.map((choice: Selector, i: number) => ({
      ...choice,
      isSelected: questionSelector.isMultiplied
        ? i === idx
          ? !choice.isSelected
          : choice.isSelected
        : i === idx,
    })),
  });
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
 * testId単位のテスト詳細情報を管理するatom
 */
const testDetailsAtom = atom<TestDetails>({});

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
 * 問題文・選択肢に対する翻訳文を管理するatom
 */
const translationInitAtom = atom<TranslationInit>(undefined);

/**
 * 問題文・選択肢に対する翻訳文を取得するatom
 */
export const fetchTranslationInitAtom = atom(
  (get) => get(translationInitAtom),
  async (
    get,
    set,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null
  ) => {
    // すでに翻訳文が存在する場合は何も取得・更新しない
    const translationInit = get(translationInitAtom);
    if (translationInit) {
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
    set(translationInitAtom, { subjects, choices });
  }
);
