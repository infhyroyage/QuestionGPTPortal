/**
 * [GET] /tests/{testId}/answers/{questionNumber} のレスポンスボディの型
 */
export type GetAnswer = {
  correctIdxes: number[];
  explanations: string[];
};

/**
 * [POST] /tests/{testId}/answers/{questionNumber} のリクエストボディの型
 */
export type PostAnswerReq = {
  courseName: string;
  subjects: string[];
  choices: string[];
};

/**
 * [POST] /tests/{testId}/answers/{questionNumber} のレスポンスボディの型
 */
export type PostAnswerRes = {
  correctIdxes: number[];
  explanations: string[];
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
 * [GET] /tests/{testId} のレスポンスボディの型
 */
export type GetTest = {
  courseName: string;
  testName: string;
  length: number;
};

/**
 * [GET] /tests のレスポンスボディの各要素の型
 */
export type Test = {
  id: string;
  testName: string;
};

/**
 * [GET] /tests のレスポンスボディの型
 */
export type GetTests = {
  [course: string]: Test[];
};

export type PutEn2JaReq = string[];
export type PutEn2JaRes = string[];

export type Method = "GET" | "POST" | "PUT";
