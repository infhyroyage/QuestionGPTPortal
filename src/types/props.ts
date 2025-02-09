import { ReactNode } from "react";
import { ProgressTestHistory } from "./storage";

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
   * 選択肢の画像
   */
  img: string | null;

  /**
   * 選択肢のクリック時の処理
   */
  onClick?: () => void;

  /**
   * 選択肢のテキスト
   */
  sentence: string;

  /**
   * 選択肢の翻訳文(翻訳文が存在しない場合はundefined)
   */
  translation?: string;

  /**
   * 選択肢のバリアント
   */
  variant: "default" | "outline";
};

/**
 * TestResultAccordionのProps
 */
export type TestResultAccordionProps = {
  /**
   * テストの回答履歴
   */
  histories: ProgressTestHistory[];
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
