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
    // ログイン後のリダイレクト先(ローカル環境の場合は現在のオリジンを使用)
    redirectUri:
      import.meta.env.VITE_MSAL_REDIRECT_URI ?? window.location.origin,
    // ログアウト後のリダイレクト先(ローカル環境の場合は現在のオリジンを使用)
    postLogoutRedirectUri:
      import.meta.env.VITE_MSAL_REDIRECT_URI ?? window.location.origin,
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
