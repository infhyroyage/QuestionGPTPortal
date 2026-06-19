import { GetQuestion, Subject } from "@/types/backend";
import { ReactNode } from "react";
import { History } from "./atoms";

/**
 * ApplyMSALのProps
 */
export type ApplyMSALProps = {
  /**
   * 子コンポーネント
   */
  children: ReactNode;
};

/**
 * FavoriteButtonのProps
 */
export type FavoriteButtonProps = {
  /**
   * お気に入り状態
   */
  isFavorite: boolean;

  /**
   * ローディング状態
   */
  isLoading: boolean;

  /**
   * お気に入り切替ボタンのお気に入り状態変更時の動作
   * @param newIsFavorite 新しいお気に入り状態
   */
  onFavoriteChange: (newIsFavorite: boolean) => void;

  /**
   * 問題番号
   */
  questionNumber: string;
};

/**
 * ImageDialogのProps
 */
export type ImageDialogProps = {
  /**
   * 画像のURL
   */
  img: string;

  /**
   * 画像の説明
   */
  alt: string;
};

/**
 * SelectorButtonのProps
 */
export type SelectorButtonProps = {
  /**
   * 選択肢のTailwindCSSのクラス名
   * デフォルトは"flex flex-col py-4 pl-4 w-full h-full space-y-1 whitespace-normal text-left items-start"
   */
  className?: string;

  /**
   * 非活性の場合はtrue、活性の場合はfalse
   */
  disabled?: boolean;

  /**
   * アルファベット表示用の選択肢のインデックス(0の場合はA、1の場合はB、...、表示しない場合はundefined)
   */
  idx?: number;

  /**
   * 選択肢の画像(画像がない場合はnull)
   */
  img: string | null;

  /**
   * 選択肢のクリック時の処理
   */
  onClick?: () => void;

  /**
   * 選択肢のテキスト(画像URLのみの場合はnull)
   */
  sentence: string | null;

  /**
   * 選択肢の翻訳文(翻訳文が存在しない場合はnull)
   */
  translation: string | null;

  /**
   * 選択肢のバリアント
   */
  variant: "primary" | "outline";
};

/**
 * SubjectDisplayのProps
 */
export type SubjectDisplayProps = {
  /**
   * 問題文
   */
  subjects?: Subject[];

  /**
   * 問題文の翻訳文
   */
  translation?: string[];
};

/**
 * TestReadyButtonsのProps
 */
export type TestReadyButtonsProps = {
  /**
   * お気に入り問題番号
   */
  favoriteQuestionNumbers: number[];
};

/**
 * TestResultAccordionUnitのProps
 */
export type TestResultAccordionUnitProps = {
  /**
   * 問題文・選択肢
   */
  getQuestion: GetQuestion | undefined;

  /**
   * 回答履歴
   */
  history: History;

  /**
   * 回答履歴のインデックス
   */
  historyIdx: number;

  /**
   * 問題番号
   */
  questionNumber: string;

  /**
   * i番目(0スタート)の問題のお気に入り状態
   */
  isFavorite: boolean;

  /**
   * 回答履歴が開かれている場合はtrue、閉じている場合はfalse
   */
  isOpen: boolean;

  /**
   * お気に入り切替ボタンがローディング中の場合はtrue、ローディング中でない場合はfalse
   */
  isLoadingFavoriteButton: boolean;

  /**
   * i番目(0スタート)の問題のお気に入り切替ボタンのお気に入り状態変更時の動作
   * @param favoriteIdx {number} i番目(0スタート)の問題のインデックス
   * @param newIsFavorite 新しいお気に入り状態
   */
  onFavoriteChange: (favoriteIdx: number, newIsFavorite: boolean) => void;

  /**
   * 回答履歴の開閉ボタンのクリック時の動作
   * @param historyIdx {string} 回答履歴のインデックス
   * @param isOpen {boolean} 回答履歴が開かれているかどうか
   */
  onToggle: (historyIdx: string, isOpen: boolean) => void;
};

/**
 * TestResultAccordionUnitContentのProps
 */
export type TestResultAccordionUnitContentProps = {
  /**
   * 問題文・選択肢
   */
  getQuestion?: GetQuestion;

  /**
   * 回答履歴
   */
  history: History;
};

/**
 * TopBarのProps
 */
export type TopBarProps = {
  /**
   * タイトル
   */
  title: string;
};
