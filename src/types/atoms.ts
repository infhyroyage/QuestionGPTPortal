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
      correctIdxes?: number[];
      isSavedProgress?: boolean;
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
      /**
       * 問題番号
       */
      questionNumber: string;

      /**
       * 各問題文
       */
      subjects: Subject[];

      /**
       * 各選択肢の文
       */
      choices: ChoiceAndSelect[];

      /**
       * 回答が複数個の場合はtrue、回答が1個の場合はfalse
       */
      isMultiplied: boolean;
    }
  | undefined;

/**
 * テスト詳細情報の要素の型
 */
export type TestDetail = {
  /**
   * コース名
   */
  courseName: string;

  /**
   * テストID
   */
  testId: string;

  /**
   * テスト名
   */
  testName: string;

  /**
   * テストの問題数
   */
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
      /**
       * 各選択肢の正解/不正解の理由
       */
      explanations: string[];
    }
  | undefined;

/**
 * 問題文・選択肢に対する翻訳文の型
 */
export type TranslationSubjectChoice =
  | {
      /**
       * 各問題文
       */
      subjects: string[];

      /**
       * 各選択肢の文
       */
      choices: string[];
    }
  | undefined;
