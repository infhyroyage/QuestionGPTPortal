/**
 * ローカルストレージに"progress"キーで保存する回答履歴の型
 */
export type Progress = {
  [testId: string]: ProgressTest;
};

/**
 * ローカルストレージに"progress"キーで保存するテストの回答履歴の型
 */
export type ProgressTest = {
  testLength: number;
  histories: ProgressTestHistory[];
};

/**
 * ローカルストレージに"progress"キーで保存する回答履歴のhistoriesの要素の型
 */
export type ProgressTestHistory = {
  isCorrect: boolean;
  choiceSentences: string[];
  choiceImgs: (string | null)[];
  choiceTranslations?: string[];
  selectedIdxes: number[];
  correctIdxes: number[];
};
