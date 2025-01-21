import { GetTest } from "./backend";

/**
 * テスト詳細情報の型
 */
export type TestDetails = {
  [testId: string]: GetTest;
};

/**
 * 問題文・選択肢に対する翻訳文の型
 */
export type TranslationInit =
  | {
      subjects: string[];
      choices: string[];
    }
  | undefined;
