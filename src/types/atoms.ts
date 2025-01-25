import { Choice, GetTest, Subject } from "./backend";

/**
 * 選択肢の型
 */
export type Selector = Choice & { isSelected: boolean };

/**
 * 回答の生成状態の型
 * * NOT_ANSWERED: 回答未生成
 * * ANSWERING: 回答生成中
 * * CORRECT: 回答生成済(正解)
 * * INCORRECT: 回答生成済(不正解)
 */
export type Submit = "NOT_ANSWERED" | "ANSWERING" | "CORRECT" | "INCORRECT";

/**
 * 問題文・選択肢の型
 */
export type QuestionSelector =
  | {
      subjects: Subject[];
      choices: Selector[];
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
