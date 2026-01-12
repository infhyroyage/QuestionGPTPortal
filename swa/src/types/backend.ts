/**
 * バックエンドのメソッドの型
 */
export type Method = "DELETE" | "GET" | "POST" | "PUT";

/**
 * [PUT] /en2ja のリクエストボディの型
 */
export type PutEn2JaReq = string[];

/**
 * [PUT] /en2ja のレスポンスボディの型
 */
export type PutEn2JaRes = string[];

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
   * 問題文から正しい回答を割り出すための回答のポイント(約300文字)
   */
  answerKeyPoint: string;

  /**
   * 正解の選択肢・正解/不正解の理由が存在する場合はtrue、存在しない場合はfalse
   */
  isExisted: boolean;
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
   * 問題文から正しい回答を割り出すための回答のポイント(約300文字)
   */
  answerKeyPoint: string;
};

/**
 * [GET] /tests/{testId}/communities/{questionNumber} のレスポンスボディの型
 */
export type GetCommunityRes = {
  /**
   * コミュニティでのディスカッションの要約
   */
  discussionsSummary: string;

  /**
   * コミュニティでの回答の割合
   */
  votes?: string[];

  /**
   * コミュニティでのディスカッションの要約が存在する場合はtrue、存在しない場合はfalse
   */
  isExisted: boolean;
};

/**
 * [POST] /tests/{testId}/communities/{questionNumber} のレスポンスボディの型
 */
export type PostCommunityRes = {
  /**
   * コミュニティでのディスカッションの要約
   */
  discussionsSummary: string;

  /**
   * コミュニティでの回答の割合
   */
  votes?: string[];

  /**
   * コミュニティでのディスカッションの要約が存在する場合はtrue、存在しない場合はfalse
   */
  isExisted: boolean;
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
 * [POST] /tests/{testId}/progresses のリクエストボディの型
 */
export type PostProgressesReq = {
  /**
   * テストを解く問題番号の順番
   */
  order: number[];
};

/**
 * [GET] /tests/{testId}/progresses のレスポンスボディの各要素の型
 */
export type Progress = {
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
 * [GET] /tests/{testId}/progresses のレスポンスボディの型
 */
export type GetProgressesRes = {
  /**
   * テストを解く問題番号の順番
   */
  order: number[];

  /**
   * 問題番号の順番に対応する進捗項目
   */
  progresses: Progress[];
};

/**
 * [POST] /tests/{testId}/progresses/{questionNumber} のリクエストボディの型
 */
export type PostProgressReq = Progress;

/**
 * [POST] /tests/{testId}/progresses/{questionNumber} のレスポンスボディの型
 */
export type PostProgressRes = Progress[];

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
   * 選択肢の文(画像URLのみの場合はnull)
   */
  sentence: string | null;

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
