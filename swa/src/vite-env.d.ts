/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URI?: string;
  readonly VITE_AZURE_AD_SP_MSAL_CLIENT_ID?: string;
  readonly VITE_AZURE_TENANT_ID?: string;
  readonly VITE_MSAL_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
