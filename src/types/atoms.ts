import { Choice, GetTest, Subject } from "./backend";

/**
 * 問題文・選択肢の型
 */
export type QuestionSelector =
  | {
      subjects: Subject[];
      choices: (Choice & { isSelected: boolean })[];
      isMultiplied: boolean;
    }
  | undefined;

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
