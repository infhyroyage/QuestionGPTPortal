export type Subject = {
  sentence: string;
  isIndicatedImg: boolean;
  isEscapedTranslation: boolean;
};

export type Choice = {
  sentence: string;
  img: string | null;
  isEscapedTranslation: boolean;
};

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

// export type PutEn2JaReq = string[];
// export type PutEn2JaRes = string[];

export type Method = "GET" | "POST" | "PUT";
