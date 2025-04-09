import { Choice, Subject } from "./backend";

/**
 * 正解・解説文・解答の生成状態の型
 * * undefined: 未生成
 * * isSubmittingが存在してtrue: 生成中
 * * isSubmittingが存在してfalse: 生成済み
 */
export type AnswerExplanation =
  | {
      correctFlags?: boolean[];
      explanations?: string[];
      communityVotes?: string[];
      isSubmitting: boolean;
      isCorrect?: boolean;
    }
  | undefined;

/**
 * 選択状態を含む選択肢の型
 */
export type ChoiceAndSelect = Choice & { isSelected: boolean };

/**
 * 問題文・選択肢の型
 */
export type QuestionSelector =
  | {
      questionNumber: string;
      subjects: Subject[];
      choices: ChoiceAndSelect[];
      isMultiplied: boolean;
    }
  | undefined;

/**
 * テスト詳細情報の要素の型
 */
export type TestDetail = {
  courseName: string;
  testId: string;
  testName: string;
  length: number;
};

/**
 * テスト詳細情報の型
 */
export type TestDetails = TestDetail[] | undefined;

/**
 * 解説文に対する翻訳文の型
 */
export type TranslationExplanation =
  | {
      explanations: string[];
    }
  | undefined;

/**
 * 問題文・選択肢に対する翻訳文の型
 */
export type TranslationSubjectChoice =
  | {
      subjects: string[];
      choices: string[];
    }
  | undefined;
