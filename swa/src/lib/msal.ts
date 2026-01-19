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
    // TODO: ハードコーディングせず、Viteの環境変数で設定
    redirectUri: "https://lively-cliff-0750a6500.1.azurestaticapps.net",
    // ログアウト後のリダイレクト先
    postLogoutRedirectUri: "https://lively-cliff-0750a6500.1.azurestaticapps.net",
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
