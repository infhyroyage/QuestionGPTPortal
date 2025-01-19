import { TestDetails } from "@/types/atoms";
import { GetTest } from "@/types/backend";
import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { atom } from "jotai";
import { accessBackend } from "./backend";

/**
 * ダークモードの場合はtrue、ライトモードの場合はfalseのatom
 * toggleDarkModeAtomで隠蔽するためexportしない
 */
const isDarkModeAtom = atom<boolean>(true);

/**
 * ダークモード化のフラグと、ダークモード切替え用のatom
 */
export const toggleDarkModeAtom = atom(
  (get) => get(isDarkModeAtom),
  (get, set) => {
    const isDarkMode = get(isDarkModeAtom);
    set(isDarkModeAtom, !isDarkMode);
  }
);

/**
 * testId単位のテスト詳細情報を管理するatom
 */
const testDetailsAtom = atom<TestDetails>({});

/**
 * testId単位のテスト詳細情報を取得するatom
 */
export const fetchTestDetailsAtom = atom(
  (get) => get(testDetailsAtom),
  async (
    get,
    set,
    testId: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null
  ) => {
    const testDetails = get(testDetailsAtom);

    // すでにtestIdのテスト詳細情報が存在する場合は何も取得・更新しない
    if (testDetails[testId]) {
      return;
    }

    // [GET] /tests/{testId}にアクセスして取得したテスト詳細情報を更新
    const res: GetTest = await accessBackend<GetTest>(
      "GET",
      `/tests/${testId}`,
      instance,
      accountInfo
    );
    set(testDetailsAtom, { ...testDetails, [testId]: res });
  }
);
