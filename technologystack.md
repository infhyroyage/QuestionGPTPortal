# 技術スタック

## 1. 要件と概要

### 1.1 要件

生成 AI を活用した、英語の IT 資格試験問題の学習支援システムのフロントエンドを提供する。

### 1.2 ソリューション概要

GitHub Pages を通して React + TypeScript をベースとしたシングルページアプリケーション(SPA)の静的サイトホスティングを行い、QuestionGPTTranslator API サーバーとセキュアに連携することで、レスポンシブデザインとアクセシビリティに配慮した、学習プラットフォームとしてのモダンな Web アプリケーションを実現する。

### 1.3 システム構成概要

フロントエンドアプリケーションの処理フローは以下の通りである:

1. ユーザーが Entra ID 認証でアプリケーションにログインし、MSAL によりアクセストークンを取得する。
2. フロントエンドアプリケーションが QuestionGPTTranslator API サーバーにアクセスし、テスト一覧・問題・選択肢を取得・表示する。
3. 翻訳機能により、英語の問題文・選択肢を日本語で表示する。
4. ユーザーが問題を解答し、Azure OpenAI による正解・解説生成機能をバックエンド経由で利用する。
5. 翻訳機能により、英語の解説を日本語で表示する。
6. 学習進捗機能により、ユーザーの学習履歴を管理する。

## 2. アーキテクチャ

### 2.1 使用技術・サービス

本システムでは、以下の技術スタックを利用して、モダンで保守性の高いフロントエンドアプリケーションを構築する:

- Node.js (JavaScript ランタイム)
- TypeScript (静的型付け JavaScript)
- React (JavaScript UI ライブラリ)
- React Router (クライアントサイドルーティング)
- Vite (ビルドツール・開発サーバー)
- Tailwind CSS (ユーティリティファースト CSS フレームワーク)
- shadcn/ui (高品質な UI コンポーネントライブラリ)
- Lucide React (アイコンライブラリ)
- Jotai (アトミックな状態管理)
- Axios (HTTP クライアント)
- Microsoft Authentication Library (MSAL) (Entra ID 認証)
- ESLint (コード静的解析・品質管理)
- Prettier (コードフォーマッタ)
- GitHub (コードリポジトリ、CI/CD パイプライン管理)
- GitHub Pages (静的サイトホスティング)

### 2.2 ページ構成・ルーティング

本アプリケーションは以下のページ構成で設計されている:

| ルート                                     | ページコンポーネント | 説明                         |
| ------------------------------------------ | -------------------- | ---------------------------- |
| `/`                                        | `RootPage`           | テスト一覧表示(トップページ) |
| `/tests/:testId/ready`                     | `TestReadyPage`      | テスト開始前の準備画面       |
| `/tests/:testId/questions/:questionNumber` | `TestQuestionPage`   | 問題解答画面                 |
| `/tests/:testId/result`                    | `TestResultPage`     | テスト結果表示画面           |
| `*`                                        | `NotFoundPage`       | 404 エラーページ             |

## 3. コア機能の実装詳細

### 3.1 API 連携

[QuestionGPTTranslator](https://github.com/infhyroyage/QuestionGPTTranslator) を API サーバーとして連携する。
API 仕様は [QuestionGPTTranslator の Swagger UI](https://infhyroyage.github.io/QuestionGPTTranslator/) を参照。
API サーバーの URL は、環境変数 `VITE_API_URI` で管理する。
API サーバーへのアクセスは、`src/lib/backend.ts` で統一的に行う。

### 3.2 認証システム

Azure 環境の場合は、Microsoft Entra ID を利用した認証システムを、Microsoft Authentication Library (MSAL)を介して実現する。MSAL の認証プロバイダーは、 React のエントリーポイントである`src/App.tsx`に対し、`src/components/ApplyMSAL.tsx` で適用する。認証後に Microsoft Indentity Platform で払い出されたアクセストークンを、`X-Access-Token`ヘッダーに設定して、QuestionGPTTranslator API サーバーにアクセスする。ローカル環境は、Entra ID 認証をスキップし、`X-User-Id: local` ヘッダーで API アクセスする。

`src/lib/msal.ts` で、以下の MSAL の設定を定義する。

- クライアント ID: 環境変数 `VITE_AZURE_AD_SP_MSAL_CLIENT_ID` で管理
- Microsoft Indentity Platform の URL: `https://login.microsoftonline.com/{テナント ID}`
  - テナント ID: 環境変数 `VITE_AZURE_TENANT_ID` で管理
- 認証後のリダイレクト URI: `https://infhyroyage.github.io/QuestionGPTPortal`
- アクセストークンの格納先: ブラウザの Session Storage

### 3.3 状態管理

以下の Jotai での Atom を用いた状態管理により、コンポーネント間でのデータ共有を実現する。

| Atom 名                        | 説明                             |
| ------------------------------ | -------------------------------- |
| `testDetailsAtom`              | テスト一覧情報                   |
| `questionSelectorAtom`         | 問題文・選択肢・選択状態         |
| `answerExplanationAtom`        | 正解・解説・回答状態             |
| `communityAtom`                | コミュニティディスカッション情報 |
| `historiesAtom`                | 回答履歴                         |
| `orderAtom`                    | 問題解答順序                     |
| `translationSubjectChoiceAtom` | 問題文・選択肢の翻訳             |
| `translationExplanationAtom`   | 解説の翻訳                       |
| `translationCommunityAtom`     | コミュニティ情報の翻訳           |
| `toggleDarkModeAtom`           | ダークモード切り替え             |

API アクセスを含む非同期処理は、Atom の write 関数で行う。この非同期処理のエラーハンドリングは、Atom の write 関数の呼び出し元コンポーネントで行う。

### 3.4 多言語翻訳システム

以下を対象とする英語から日本語への翻訳を QuestionGPTTranslator API サーバーを介して実現する。

- 問題文
- 選択肢
- 正解/不正解の理由の解説文
- コミュニティディスカッション要約

このうち、問題文と選択肢は、両者をまとめて翻訳することで、API 呼び出し回数を最適化している。
翻訳処理は、`src/lib/translation.ts` で統一的に行う。
翻訳中でもユーザーの直感的なインタラクションを提供するために、shadcn/ui の`Skeleton`コンポーネントを用いた表示を採用する。

### 3.5 UI/UX 設計

レスポンシブデザインに対応した Web アプリケーションを実現するために、Tailwind CSS によるモバイルファースト設計を採用する。
Tailwind CSS ベースな UI を統一的に提供するために、shadcn/ui、Lucide React を採用する。
システム設定と連動したダークモードも用意しており、ユーザーが柔軟に切替できる。
