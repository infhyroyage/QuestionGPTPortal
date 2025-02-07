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
