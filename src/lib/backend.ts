import { Method } from "@/types/backend";
import {
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
  IPublicClientApplication,
} from "@azure/msal-browser";
import axios, { AxiosHeaders, AxiosResponse } from "axios";
import { backendAccessScopes } from "./msal";

/**
 * axiosを用いてバックエンドにアクセスし、レスポンスをそのまま返す
 * @param {Method} method HTTPメソッドタイプ
 * @param {string} url URL
 * @param {string | undefined} accessToken アクセストークン
 * @param {D | undefined} data リクエストデータ
 * @returns {Promise<T>} レスポンス
 */
async function callByAxios<T, D>(
  method: Method,
  url: string,
  accessToken?: string,
  data?: D
): Promise<T> {
  const headers = new AxiosHeaders();
  // アクセストークンがある場合は設定
  if (accessToken) {
    headers.set("X-Access-Token", accessToken);
  }
  // ローカル環境の場合はユーザーIDを設定
  if (import.meta.env.DEV) {
    headers.set("X-User-Id", "local");
  }

  // axios実行
  let res: AxiosResponse<T, D>;
  switch (method) {
    case "GET":
      res = await axios.get<T, AxiosResponse<T, D>>(url, { headers });
      break;
    case "POST":
      res = await axios.post<T, AxiosResponse<T, D>, D>(url, data, {
        headers,
      });
      break;
    case "PUT":
      res = await axios.put<T, AxiosResponse<T, D>, D>(url, data, {
        headers,
      });
      break;
    case "DELETE":
      res = await axios.delete<T, AxiosResponse<T, D>>(url, { headers });
      break;
  }
  if (res.status !== 200) {
    throw new Error(res.statusText);
  }

  return res.data;
}

/**
 * MSAL経由で認証を行い、バックエンドにアクセスする
 * @param {Method} method HTTPメソッドタイプ
 * @param {string} path パス
 * @param {IPublicClientApplication} msalInstance MSALインスタンス
 * @param {AccountInfo | null} accountInfo ログイン済のアカウント情報
 * @param {D | undefined} data リクエストデータ
 * @returns {Promise<T>} レスポンス
 */
export async function accessBackend<T, D = never>(
  method: Method,
  path: string,
  msalInstance: IPublicClientApplication,
  accountInfo: AccountInfo | null,
  data?: D
): Promise<T> {
  const apiUri: string | undefined = import.meta.env.VITE_API_URI;
  if (!apiUri) {
    throw new Error("Unset VITE_API_URI");
  }

  const url: string = `${apiUri}/api${path}`;

  // ローカル環境の場合は認証をスキップし、そのままバックエンドにアクセス
  if (import.meta.env.DEV) {
    return await callByAxios<T, D>(method, url, undefined, data);
  }

  try {
    // バックエンドにアクセスするためのアクセストークンを取得してから、バックエンドにアクセス
    const msalRes: AuthenticationResult = await msalInstance.acquireTokenSilent(
      {
        scopes: backendAccessScopes.accessAsUser,
        account: accountInfo || undefined,
      }
    );
    return await callByAxios<T, D>(method, url, msalRes.accessToken, data);
  } catch (err) {
    // アクセストークン取得エラーの場合は、ポップアップで認証してからバックエンドにアクセス
    if (err instanceof InteractionRequiredAuthError) {
      const msalRes: AuthenticationResult =
        await msalInstance.acquireTokenPopup({
          scopes: backendAccessScopes.accessAsUser,
        });
      return await callByAxios<T, D>(method, url, msalRes.accessToken, data);
    } else {
      throw err;
    }
  }
}
