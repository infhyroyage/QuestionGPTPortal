/**
 * [GET] /tests/{testId}/answers/{questionNumber} のレスポンスボディの型
 */
export type GetAnswer = {
  /**
   * 正解の選択肢のインデックス
   */
  correctIdxes?: number[];

  /**
   * 各選択肢の正解/不正解の理由
   */
  explanations?: string[];

  /**
   * コミュニティ回答割合
   */
  communityVotes?: string[];
};

/**
 * [POST] /tests/{testId}/answers/{questionNumber} のレスポンスボディの型
 */
export type PostAnswerRes = {
  /**
   * 正解の選択肢のインデックス
   */
  correctIdxes: number[];

  /**
   * 各選択肢の正解/不正解の理由
   */
  explanations: string[];

  /**
   * コミュニティ回答割合
   */
  communityVotes: string[];
};

/**
 * [GET] /tests/{testId}/favorites のレスポンスボディの各要素の型
 */
export type Favorite = {
  /**
   * 問題番号
   */
  questionNumber: number;

  /**
   * お気に入りの場合はtrue、そうでない場合はfalse
   */
  isFavorite: boolean;
};

/**
 * [GET] /tests/{testId}/favorites のレスポンスボディの型
 */
export type GetFavoritesRes = Favorite[];

/**
 * [GET] /tests/{testId}/favorites/{questionNumber} のレスポンスボディの型
 */
export type GetFavoriteRes = {
  /**
   * お気に入りの場合はtrue、そうでない場合はfalse
   */
  isFavorite: boolean;
};

/**
 * [POST] /tests/{testId}/favorites/{questionNumber} のリクエストボディの型
 */
export type PostFavoriteReq = GetFavoriteRes;

/**
 * [GET] /tests/{testId}/progresses のレスポンスボディの各要素の型
 */
export type Progress = {
  /**
   * 正解の場合はtrue、不正解の場合はfalse
   */
  isCorrect: boolean;

  /**
   * 選択肢の文
   */
  choiceSentences: string[];

  /**
   * 選択肢の文に続く画像URL(画像がない場合はnull)
   */
  choiceImgs: (string | null)[];

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
 * [GET] /tests/{testId}/progresses のレスポンスボディの型
 */
export type GetProgressesRes = Progress[];

/**
 * [POST] /tests/{testId}/progresses/{questionNumber} のリクエストボディの型
 */
export type PostProgressReq = Progress;

/**
 * [GET] /tests/{testId}/questions/{questionNumber} のレスポンスボディの問題文の型
 */
export type Subject = {
  /**
   * 問題文
   */
  sentence: string;

  /**
   * 問題文の文章が画像URLである場合はtrue、そうでない場合はfalse
   */
  isIndicatedImg: boolean;

  /**
   * 翻訳不要の場合はtrue、翻訳する場合はfalse
   */
  isEscapedTranslation: boolean;
};

/**
 * [GET] /tests/{testId}/questions/{questionNumber} のレスポンスボディの選択肢の型
 */
export type Choice = {
  /**
   * 選択肢の文
   */
  sentence: string;

  /**
   * 選択肢の文に続く画像URL(画像がない場合はnull)
   */
  img: string | null;

  /**
   * 翻訳不要の場合はtrue、翻訳する場合はfalse
   */
  isEscapedTranslation: boolean;
};

/**
 * [GET] /tests/{testId}/questions/{questionNumber} のレスポンスボディの型
 */
export type GetQuestion = {
  /**
   * 各問題文
   */
  subjects: Subject[];

  /**
   * 各選択肢の文
   */
  choices: Choice[];

  /**
   * 回答が複数個の場合はtrue、回答が1個の場合はfalse
   */
  isMultiplied: boolean;
};

/**
 * [GET] /tests のレスポンスボディの各要素の型
 */
export type Test = {
  /**
   * テストID
   */
  id: string;

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
 * [GET] /tests のレスポンスボディの型
 */
export type GetTests = {
  /**
   * コース名をキーとする、各テストの連想配列
   */
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
 * バックエンドのメソッドの型
 */
export type Method = "DELETE" | "GET" | "POST" | "PUT";
