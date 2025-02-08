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
 * TestResultTableのProps
 */
export type TestResultTableProps = {
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
