import { Configuration } from "@azure/msal-browser";
import { resolveMsalRedirectUri } from "./msalRedirectUri";

/**
 * ログイン後・ログアウト後のリダイレクト先。
 * 本番は Vite 環境変数 VITE_MSAL_REDIRECT_URI を使う。
 */
const redirectUri = resolveMsalRedirectUri(
  import.meta.env.VITE_MSAL_REDIRECT_URI,
  import.meta.env.DEV,
  () => window.location.origin,
);

/**
 * MSALプロバイダー使用時のコンフィグ
 */
export const config: Configuration = {
  auth: {
    clientId: `${import.meta.env.VITE_AZURE_AD_SP_MSAL_CLIENT_ID}`,
    authority: `https://login.microsoftonline.com/${
      import.meta.env.VITE_AZURE_TENANT_ID
    }`,
    // ログイン後のリダイレクト先
    redirectUri,
    // ログアウト後のリダイレクト先
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    // アクセストークンの格納先
    cacheLocation: "sessionStorage",
  },
};

/**
 * ログイン時の認証のスコープ
 */
export const loginScope = {
  scopes: [],
};

/**
 * バックエンドのREST APIアクセスのスコープ
 */
export const backendAccessScopes = {
  accessAsUser: [
    `api://${import.meta.env.VITE_AZURE_AD_SP_MSAL_CLIENT_ID}/access_as_user`,
  ],
};
