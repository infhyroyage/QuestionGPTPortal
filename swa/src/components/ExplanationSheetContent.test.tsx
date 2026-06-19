import { Method } from "@/types/backend";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getDefaultStore } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// バックエンドアクセス層をモックし、GET(高速)/POST(低速)のタイミングを制御する
const accessBackendMock = vi.fn();
vi.mock("@/lib/backend", () => ({
  accessBackend: (
    method: Method,
    path: string,
    instance: unknown,
    accountInfo: unknown,
    data?: unknown,
  ) => accessBackendMock(method, path, instance, accountInfo, data),
}));

// MSAL/ルーター/トーストをモック
vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance: {}, accounts: [] }),
  useAccount: () => null,
}));
vi.mock("react-router", () => ({
  useParams: () => ({ testId: "test1", questionNumber: "1" }),
}));
vi.mock("@/hooks/useSystemErrorToast", () => ({
  default: () => () => undefined,
}));
vi.mock("@/hooks/useTranslationFailedToast", () => ({
  default: () => () => undefined,
}));

import ExplanationSheetContent from "@/components/ExplanationSheetContent";
import {
  fetchDiscussionAtom,
  fetchExplanationsOnlyAtom,
  fetchProgressesAtom,
  fetchQuestionSelectorAtom,
  fetchTestDetailsAtom,
  fetchTranslationDiscussionAtom,
  resetAtomsForAllTestPagesAtom,
} from "@/lib/atoms";

const OLD_SUMMARY = "OLD community summary";
const NEW_SUMMARY = "NEW community summary";
const translate = (text: string) => `JA:${text}`;

type Deferred = { promise: Promise<unknown>; resolve: (v: unknown) => void };
function createDeferred(): Deferred {
  let resolve!: (v: unknown) => void;
  const promise = new Promise<unknown>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

// POST /discussions(再生成)を手動で解決できるように保持する
let postDiscussionDeferred: Deferred;

function setupAccessBackend() {
  postDiscussionDeferred = createDeferred();
  accessBackendMock.mockImplementation(
    async (method: Method, path: string, _i: unknown, _a: unknown, data?: unknown) => {
      // テスト一覧
      if (method === "GET" && path === "/tests") {
        return { Course: [{ id: "test1", testName: "Test 1", length: 3 }] };
      }
      // 進捗(問題1は回答済み)
      if (method === "GET" && path === "/tests/test1/progresses") {
        return {
          order: [1, 2, 3],
          progresses: [
            { isCorrect: true, selectedIdxes: [0], correctIdxes: [0] },
          ],
        };
      }
      // 問題文・選択肢
      if (method === "GET" && path === "/tests/test1/questions/1") {
        return {
          subjects: [
            { sentence: "Q", isIndicatedImg: false, isEscapedTranslation: false },
          ],
          choices: [
            { sentence: "A", img: null, isEscapedTranslation: false },
            { sentence: "B", img: null, isEscapedTranslation: false },
          ],
          isMultiplied: false,
        };
      }
      // 解説(取得済み)
      if (method === "GET" && path === "/tests/test1/answers/1") {
        return {
          isExisted: true,
          correctIdxes: [0],
          explanations: ["exp A", "exp B"],
          answerKeyPoint: "key point",
        };
      }
      // コミュニティ回答割合
      if (method === "GET" && path === "/tests/test1/votes/1") {
        return ["A: 50%", "B: 50%"];
      }
      // コミュニティ情報の取得(GET)は高速に古いキャッシュを返す
      // (再生成のPOSTが反映される前のキャッシュ遅延を模擬)
      if (method === "GET" && path === "/tests/test1/discussions/1") {
        return { isExisted: true, summary: OLD_SUMMARY };
      }
      // コミュニティ情報の再生成(POST)は低速に新しい要約を返す
      if (method === "POST" && path === "/tests/test1/discussions/1") {
        await postDiscussionDeferred.promise;
        return { isExisted: true, summary: NEW_SUMMARY };
      }
      // 翻訳(入力テキストを "JA:" 付きで返す)
      if (method === "PUT" && path === "/en2ja") {
        return (data as string[]).map(translate);
      }
      throw new Error(`Unexpected request: ${method} ${path}`);
    },
  );
}

describe("ExplanationSheetContent コミュニティ情報の再取得", () => {
  beforeEach(async () => {
    setupAccessBackend();
    const store = getDefaultStore();
    // 状態を初期化
    store.set(resetAtomsForAllTestPagesAtom);

    // 解説シート表示に必要な前提状態(回答済みの問題)を準備
    await store.set(fetchTestDetailsAtom, {}, null);
    await store.set(fetchProgressesAtom, "test1", {}, null);
    await store.set(fetchQuestionSelectorAtom, "test1", "1", {}, null);
    await store.set(fetchExplanationsOnlyAtom, "test1", "1", {}, null);

    // 解説シートを「以前に開いた」状態を模擬:
    // コミュニティ情報(古い要約)とその翻訳を取得済みにしておく
    await store.set(fetchDiscussionAtom, "test1", "1", {}, null);
    await store.set(fetchTranslationDiscussionAtom, {}, null);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Given: コミュニティ情報(古い要約+翻訳)を取得済みで解説シートを開き直した状態
  // When: 「コミュニティ情報を再取得」を押下し、GET(古い・高速)とPOST(新しい・低速)が発生
  // Then: 最終的に新しい要約と、それに連動した新しい翻訳が表示される
  it("再取得後に新しい要約とそれに連動した翻訳が表示される", async () => {
    const user = userEvent.setup();
    render(<ExplanationSheetContent />);

    // 開き直し直後は古い要約とその翻訳が表示されている
    await screen.findByText(OLD_SUMMARY);
    await screen.findByText(translate(OLD_SUMMARY));

    // 再取得ボタンを押下
    const refreshButton = screen.getByTitle("コミュニティ情報を再取得");
    await user.click(refreshButton);

    // 再生成(POST)の完了を遅延させて発火させる
    postDiscussionDeferred.resolve(undefined);

    // 新しい要約が表示される
    await screen.findByText(NEW_SUMMARY);

    // 翻訳が新しい要約に連動して更新される(古い翻訳のまま残らない)
    await waitFor(() => {
      expect(screen.getByText(translate(NEW_SUMMARY))).toBeTruthy();
    });
    expect(screen.queryByText(translate(OLD_SUMMARY))).toBeNull();
  });
});
