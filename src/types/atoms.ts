import { GetTest } from "./backend";

/**
 * テスト詳細情報の型
 */
export type TestDetails = {
  [testId: string]: GetTest;
};
