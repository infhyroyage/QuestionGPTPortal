import { TestDetails, TranslationInit } from "@/types/atoms";
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
 * ダークモードの場合はtrue、ライトモードの場合はfalseのatom
 * toggleDarkModeAtomで隠蔽するためexportしない
 */
const isDarkModeAtom = atom<boolean>(true);

/**
 * 問題文を管理するatom
 */
const questionAtom = atom<GetQuestion | undefined>(undefined);

/**
 * 問題文を取得するatom
 */
export const fetchQuestionAtom = atom(
  (get) => get(questionAtom),
  async (
    get,
    set,
    testId: string,
    questionNumber: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null
  ) => {
    // すでに問題文が存在する場合は何も取得・更新しない
    const question = get(questionAtom);
    if (question) {
      return;
    }

    // [GET] /tests/{testId}/questions/{questionNumber}にアクセスして取得した問題文で更新
    const res: GetQuestion = await accessBackend<GetQuestion>(
      "GET",
      `/tests/${testId}/questions/${questionNumber}`,
      instance,
      accountInfo
    );
    set(questionAtom, res);
  }
);

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
    const question = get(questionAtom);
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
