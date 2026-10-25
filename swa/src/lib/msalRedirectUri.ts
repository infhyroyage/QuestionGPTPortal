const UNSET_REDIRECT_URI_MESSAGE = "Unset VITE_MSAL_REDIRECT_URI";

/**
 * 文字列のリダイレクト URI を正規化する。
 * 未設定・空・文字列以外は未設定として扱う。
 * @param value 環境変数またはオリジンの候補
 * @returns 前後空白を除いた URI。未設定なら undefined
 */
function normalizeRedirectUri(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed;
}

/**
 * ログイン後・ログアウト後のリダイレクト先を決める。
 * `VITE_MSAL_REDIRECT_URI` が設定されていればそれを使う。
 * ローカル開発で未設定のときだけ、現在のオリジンへフォールバックする。
 * @param configuredUri Vite 環境変数 VITE_MSAL_REDIRECT_URI の値
 * @param isDev ローカル開発ビルドかどうか
 * @param currentOrigin 現在のオリジンを返す関数。未設定の開発時だけ呼ぶ
 * @returns リダイレクト URI
 */
export function resolveMsalRedirectUri(
  configuredUri: unknown,
  isDev: boolean,
  currentOrigin: () => unknown,
): string {
  const configured = normalizeRedirectUri(configuredUri);
  if (configured !== undefined) {
    return configured;
  }

  if (isDev) {
    const origin = normalizeRedirectUri(currentOrigin());
    if (origin !== undefined) {
      return origin;
    }
  }

  throw new Error(UNSET_REDIRECT_URI_MESSAGE);
}
