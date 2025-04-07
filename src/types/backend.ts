/**
 * [GET] /tests/{testId}/answers/{questionNumber} のレスポンスボディの型
 */
export type GetAnswer = {
  correctIdxes: number[];
  explanations: string[];
  communityVotes: string[];
};

/**
 * [POST] /tests/{testId}/answers/{questionNumber} のレスポンスボディの型
 */
export type PostAnswerRes = {
  correctIdxes: number[];
  explanations: string[];
  communityVotes: string[];
};

/**
 * [GET] /tests/{testId}/questions/{questionNumber} のレスポンスボディの問題文の型
 */
export type Subject = {
  sentence: string;
  isIndicatedImg: boolean;
  isEscapedTranslation: boolean;
};

/**
 * [GET] /tests/{testId}/questions/{questionNumber} のレスポンスボディの選択肢の型
 */
export type Choice = {
  sentence: string;
  img: string | null;
  isEscapedTranslation: boolean;
};

/**
 * [GET] /tests/{testId}/questions/{questionNumber} のレスポンスボディの型
 */
export type GetQuestion = {
  subjects: Subject[];
  choices: Choice[];
  isMultiplied: boolean;
};

/**
 * [GET] /tests のレスポンスボディの各要素の型
 */
export type Test = {
  id: string;
  testName: string;
  length: number;
};

/**
 * [GET] /tests のレスポンスボディの型
 */
export type GetTests = {
  [courseName: string]: Test[];
};

/**
 * [PUT] /en2ja のリクエストボディの型
 */
export type PutEn2JaReq = string[];

/**
 * [PUT] /en2ja のレスポンスボディの型
 */
export type PutEn2JaRes = string[];

/**
 * [POST] /tests/{testId}/progresses/{questionNumber} のリクエストボディの型
 */
export type PostProgressReq = {
  isCorrect: boolean;
  choiceSentences: string[];
  choiceImgs: (string | null)[];
  choiceTranslations?: string[];
  selectedIdxes: number[];
  correctIdxes: number[];
};

/**
 * バックエンドのメソッドの型
 */
export type Method = "DELETE" | "GET" | "POST" | "PUT";
