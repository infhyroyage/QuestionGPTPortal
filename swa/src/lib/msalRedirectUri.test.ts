import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveMsalRedirectUri } from "./msalRedirectUri.ts";

const CONFIGURED_URI = "https://example.azurestaticapps.net";
const DEV_ORIGIN = "http://localhost:5173";
const UNSET_MESSAGE = "Unset VITE_MSAL_REDIRECT_URI";

/**
 * 未設定エラーの型とメッセージを検証する
 * @param configuredUri 環境変数の候補
 * @param isDev ローカル開発ビルドかどうか
 * @param origin オリジン取得の戻り値
 * @param originCalls オリジン取得の呼び出し回数の検証先
 */
function expectUnsetError(
  configuredUri: unknown,
  isDev: boolean,
  origin: unknown,
  originCalls: { count: number },
): void {
  assert.throws(
    () =>
      resolveMsalRedirectUri(configuredUri, isDev, () => {
        originCalls.count += 1;
        return origin;
      }),
    (err: unknown) => {
      assertUnsetError(err);
      return true;
    },
  );
}

/**
 * 未設定エラーの型とメッセージを確認する
 * @param err 捕捉した例外
 */
function assertUnsetError(err: unknown): void {
  if (!(err instanceof Error)) {
    assert.fail(`expected Error but received ${String(err)}`);
  }
  assert.equal(err.name, "Error");
  assert.equal(err.message, UNSET_MESSAGE);
}

describe("resolveMsalRedirectUri", () => {
  it("TC-N-01: 本番で環境変数の URL を返す", () => {
    // Given: 本番ビルドで VITE_MSAL_REDIRECT_URI に絶対 URL がある
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    const actual = resolveMsalRedirectUri(CONFIGURED_URI, false, () => {
      originCalls.count += 1;
      return DEV_ORIGIN;
    });

    // Then: 環境変数の URL を返し、オリジンは参照しない
    assert.equal(actual, CONFIGURED_URI);
    assert.equal(originCalls.count, 0);
  });

  it("TC-N-02: 開発時も環境変数が優先される", () => {
    // Given: 開発ビルドでも VITE_MSAL_REDIRECT_URI が設定されている
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    const actual = resolveMsalRedirectUri(CONFIGURED_URI, true, () => {
      originCalls.count += 1;
      return DEV_ORIGIN;
    });

    // Then: オリジンではなく環境変数の URL を返す
    assert.equal(actual, CONFIGURED_URI);
    assert.equal(originCalls.count, 0);
  });

  it("TC-N-03: 前後の空白を除いた URL を返す", () => {
    // Given: 環境変数の URL の前後に空白がある
    const configuredUri = `  ${CONFIGURED_URI}  `;

    // When: 本番ビルドでリダイレクト URI を解決する
    const actual = resolveMsalRedirectUri(configuredUri, false, () => DEV_ORIGIN);

    // Then: 空白を除いた URL を返す
    assert.equal(actual, CONFIGURED_URI);
  });

  it("TC-N-04: 1文字の URI もそのまま返す", () => {
    // Given: 空ではない最小長の文字列が設定されている
    const configuredUri = "a";

    // When: 本番ビルドでリダイレクト URI を解決する
    const actual = resolveMsalRedirectUri(configuredUri, false, () => DEV_ORIGIN);

    // Then: その文字列を返す
    assert.equal(actual, configuredUri);
  });

  it("TC-N-05: 長い URI も切り詰めずに返す", () => {
    // Given: 仕様上の上限はない長い URL が設定されている
    const configuredUri = `https://example.azurestaticapps.net/${"a".repeat(2048)}`;

    // When: 本番ビルドでリダイレクト URI を解決する
    const actual = resolveMsalRedirectUri(configuredUri, false, () => DEV_ORIGIN);

    // Then: 入力と同じ URL を返す
    assert.equal(actual, configuredUri);
  });

  it("TC-N-06: 開発時に未設定なら現在のオリジンを返す", () => {
    // Given: 開発ビルドで環境変数が未設定
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    const actual = resolveMsalRedirectUri(undefined, true, () => {
      originCalls.count += 1;
      return DEV_ORIGIN;
    });

    // Then: 現在のオリジンを一度だけ返す
    assert.equal(actual, DEV_ORIGIN);
    assert.equal(originCalls.count, 1);
  });

  it("TC-N-07: 開発時に空文字なら現在のオリジンを返す", () => {
    // Given: 開発ビルドで環境変数が空文字
    // When: リダイレクト URI を解決する
    const actual = resolveMsalRedirectUri("", true, () => DEV_ORIGIN);

    // Then: 現在のオリジンを返す
    assert.equal(actual, DEV_ORIGIN);
  });

  it("TC-N-08: 開発時に空白のみなら現在のオリジンを返す", () => {
    // Given: 開発ビルドで環境変数が空白のみ
    // When: リダイレクト URI を解決する
    const actual = resolveMsalRedirectUri("   ", true, () => `  ${DEV_ORIGIN}  `);

    // Then: 空白を除いたオリジンを返す
    assert.equal(actual, DEV_ORIGIN);
  });

  it("TC-N-09: 開発時に null なら現在のオリジンを返す", () => {
    // Given: 開発ビルドで環境変数が null
    // When: リダイレクト URI を解決する
    const actual = resolveMsalRedirectUri(null, true, () => DEV_ORIGIN);

    // Then: 現在のオリジンを返す
    assert.equal(actual, DEV_ORIGIN);
  });

  it("TC-A-01: 本番で undefined なら未設定エラー", () => {
    // Given: 本番ビルドで環境変数が undefined
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    // Then: 未設定エラーになり、オリジンは参照しない
    expectUnsetError(undefined, false, DEV_ORIGIN, originCalls);
    assert.equal(originCalls.count, 0);
  });

  it("TC-A-02: 本番で null なら未設定エラー", () => {
    // Given: 本番ビルドで環境変数が null
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    // Then: 未設定エラーになる
    expectUnsetError(null, false, DEV_ORIGIN, originCalls);
    assert.equal(originCalls.count, 0);
  });

  it("TC-A-03: 本番で空文字なら未設定エラー", () => {
    // Given: 本番ビルドで環境変数が空文字
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    // Then: 未設定エラーになる
    expectUnsetError("", false, DEV_ORIGIN, originCalls);
    assert.equal(originCalls.count, 0);
  });

  it("TC-A-04: 本番で空白のみなら未設定エラー", () => {
    // Given: 本番ビルドで環境変数が空白のみ
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    // Then: 未設定エラーになる
    expectUnsetError("   ", false, DEV_ORIGIN, originCalls);
    assert.equal(originCalls.count, 0);
  });

  it("TC-A-05: 本番で数値 0 なら未設定エラー", () => {
    // Given: 本番ビルドで環境変数が数値 0
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    // Then: 文字列ではないため未設定エラーになる
    expectUnsetError(0, false, DEV_ORIGIN, originCalls);
    assert.equal(originCalls.count, 0);
  });

  it("TC-A-06: 本番で数値 1 なら未設定エラー", () => {
    // Given: 本番ビルドで環境変数が数値 1
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    // Then: 文字列ではないため未設定エラーになる
    expectUnsetError(1, false, DEV_ORIGIN, originCalls);
    assert.equal(originCalls.count, 0);
  });

  it("TC-A-07: 本番で数値 -1 なら未設定エラー", () => {
    // Given: 本番ビルドで環境変数が数値 -1
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    // Then: 文字列ではないため未設定エラーになる
    expectUnsetError(-1, false, DEV_ORIGIN, originCalls);
    assert.equal(originCalls.count, 0);
  });

  it("TC-A-08: 本番でオブジェクトなら未設定エラー", () => {
    // Given: 本番ビルドで環境変数がオブジェクト
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    // Then: 文字列ではないため未設定エラーになる
    expectUnsetError({}, false, DEV_ORIGIN, originCalls);
    assert.equal(originCalls.count, 0);
  });

  it("TC-A-09: 開発時にオリジンが空なら未設定エラー", () => {
    // Given: 開発ビルドで環境変数が未設定、オリジンも空
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    // Then: フォールバックできず未設定エラーになる
    expectUnsetError(undefined, true, "", originCalls);
    assert.equal(originCalls.count, 1);
  });

  it("TC-A-10: 開発時にオリジンが空白のみなら未設定エラー", () => {
    // Given: 開発ビルドで環境変数が未設定、オリジンが空白のみ
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    // Then: フォールバックできず未設定エラーになる
    expectUnsetError(undefined, true, "   ", originCalls);
    assert.equal(originCalls.count, 1);
  });

  it("TC-A-11: 開発時にオリジンが文字列以外なら未設定エラー", () => {
    // Given: 開発ビルドで環境変数が未設定、オリジン取得が数値を返す
    const originCalls = { count: 0 };

    // When: リダイレクト URI を解決する
    // Then: フォールバックできず未設定エラーになる
    expectUnsetError(undefined, true, 0, originCalls);
    assert.equal(originCalls.count, 1);
  });

  it("TC-A-12: 開発時にオリジン取得の例外を伝播する", () => {
    // Given: 開発ビルドで環境変数が未設定、オリジン取得が失敗する
    const failure = new Error("origin unavailable");

    // When: リダイレクト URI を解決する
    // Then: オリジン取得の例外種別とメッセージをそのまま伝播する
    assert.throws(
      () =>
        resolveMsalRedirectUri(undefined, true, () => {
          throw failure;
        }),
      (err: unknown) => {
        assert.equal(err, failure);
        if (!(err instanceof Error)) {
          assert.fail(`expected Error but received ${String(err)}`);
        }
        assert.equal(err.name, "Error");
        assert.equal(err.message, "origin unavailable");
        return true;
      },
    );
  });
});
