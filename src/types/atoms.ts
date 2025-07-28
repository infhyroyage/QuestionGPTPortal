import { Choice, Subject } from "./backend";

/**
 * 正解・解説文を管理するatomの型
 * 初期値の場合はundefined
 */
export type AnswerExplanation =
  | {
      /**
       * 正解・解説文が生成中の場合はtrue、
       * 正解・解説文が生成済みの場合はfalse
       */
      isSubmitting: boolean;

      /**
       * 正解・解説文が生成済みかつ正解の場合はtrue、
       * 正解・解説文が生成済みかつ不正解の場合はfalse
       * 正解・解説文が生成中の場合はundefined
       */
      correctFlags?: boolean[];

      /**
       * 正解・解説文が生成済みの場合は各選択肢の正解/不正解の理由、
       * 正解・解説文が生成中の場合はundefined
       */
      explanations?: string[];

      /**
       * 正解・解説文が生成済みかつ正解の場合はtrue、
       * 正解・解説文が生成済みかつ不正解の場合はfalse、
       * 正解・解説文が生成中の場合はundefined
       */
      isCorrect?: boolean;

      /**
       * 正解・解説文が生成済みの場合は正解の選択肢のインデックス、
       * 正解・解説文が生成中の場合はundefined
       */
      correctIdxes?: number[];

      /**
       * 正解・解説文が生成済みかつ回答履歴が保存済みの場合はtrue、
       * 正解・解説文が生成済みかつ回答履歴が未保存の場合はfalse、
       * 正解・解説文が生成中の場合はundefined
       */
      isSavedProgress?: boolean;
    }
  | undefined;

/**
 * コミュニティ情報を管理するatomの型
 * 初期値の場合はundefined
 */
export type Community =
  | {
      /**
       * コミュニティでのディスカッションの要約
       * コミュニティ情報が生成中、またはデータが存在しない場合はundefined
       */
      discussionsSummary?: string;

      /**
       * コミュニティでのディスカッションの要約の翻訳文
       * 翻訳文が生成中、またはデータが存在しない場合はundefined
       */
      translatedDiscussionsSummary?: string;

      /**
       * コミュニティでの回答の割合
       * コミュニティ情報が生成中、またはデータが存在しない場合はundefined
       */
      votes?: string[];
    }
  | undefined;

/**
 * 選択状態を含む選択肢の型
 */
export type ChoiceAndSelect = Choice & { isSelected: boolean };

/**
 * 回答履歴の要素の型
 */
export type History = {
  /**
   * 正解の場合はtrue、不正解の場合はfalse
   */
  isCorrect: boolean;

  /**
   * 選択した選択肢のインデックス
   */
  selectedIdxes: number[];

  /**
   * 正解の選択肢のインデックス
   */
  correctIdxes: number[];
};

/**
 * 回答履歴を管理するatomの型
 * 初期値の場合はundefined
 */
export type Histories = History[] | undefined;

/**
 * テストを解く問題番号の順番を管理するatomの型
 * 初期値の場合はundefined
 */
export type Order = number[] | undefined;

/**
 * 問題文・選択肢を管理するatomの型
 * 初期値の場合はundefined
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
 * テスト詳細情報を管理するatomの型
 * 初期値の場合はundefined
 */
export type TestDetails = TestDetail[] | undefined;



/**
 * 解説文に対する翻訳文を管理するatomの型
 * 初期値の場合はundefined
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
 * 問題文・選択肢に対する翻訳文を管理するatomの型
 * 初期値の場合はundefined
 */
export type TranslationSubjectChoice =
  | {
      /**
       * 各問題文
       */
      subjects: string[];

      /**
       * 各選択肢の文(画像URLのみの場合はnull)
       */
      choices: (string | null)[];
    }
  | undefined;
