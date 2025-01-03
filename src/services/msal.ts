import { Configuration } from "@azure/msal-browser";

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
    redirectUri: "https://infhyroyage.github.io/QuestionGPTPortal",
    // ログアウト後のリダイレクト先
    postLogoutRedirectUri: "https://infhyroyage.github.io/QuestionGPTPortal",
  },
  cache: {
    // アクセストークンの格納先
    cacheLocation: "sessionStorage",
    // IE11/Edgeでの動作で問題が発生する場合のみtrueに設定
    storeAuthStateInCookie: false,
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
