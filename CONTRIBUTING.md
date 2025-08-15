# Contribution Guide

## 開発ツール

本システムの開発には、以下のツールとテクノロジーを使用する:

- Node.js 22.17.1 (JavaScript ランタイム)
- React 18.3.1 + TypeScript 5.5.3 (フロントエンドフレームワーク)
- Vite 7.0.6 (ビルドツール・開発サーバー)
- ESLint 9.31.0 + TypeScript ESLint 8.37.0 (コード静的解析)
- Tailwind CSS 4.1.11 + shadcn/ui (UI フレームワーク)
- Jotai 2.12.3 (状態管理)
- React Router 7.1.1 (ルーティング)
- Axios 1.11.0 (HTTP クライアント)
- MSAL (Entra ID 認証)

## ローカル開発環境のセットアップ

[localenvironment.md](localenvironment.md) 参照。

## 開発時の実装規則

コード品質と一貫性を確保するため、以下の実装規則に従う:

- Web アプリケーションは、React を用いた Single Page Application(SPA)として構築する。
- ルーティング機能を持つ、QuestionGPTTranslator リポジトリで構築した Azure Static Web Apps に SPA をデプロイしてホスティングする。
- 再利用可能なコンポーネントは src/components に配置し、src/components/ui には shadcn/ui ベースの基本 UI コンポーネントを配置する。
- ルートごとのページコンポーネントは src/pages に配置する。
- ユーティリティ関数、API 通信、状態管理などのビジネスロジックは src/lib に配置する。
- カスタムフックは src/hooks に配置する。
- TypeScript の型定義は src/types に配置し、以下のファイルに分類する:
  - atoms.ts: Jotai の Atom 関連の型定義
  - backend.ts: バックエンド API の型定義
  - props.ts: コンポーネントの Props 型定義(すべてのコンポーネントで Props の型を明確に定義する)
- Atom 名は`{機能名}Atom` の形式で命名する(例:`testDetailsAtom`)。
- API アクセスを含む非同期処理は Atom の write 関数で実装する。
- すべてのスタイリングは Tailwind CSS のユーティリティクラスを使用する。
- UI コンポーネントは shadcn/ui をベースとし、必要に応じてカスタマイズする。
- モバイルファーストで設計し、適切なブレークポイントを使用する。
- tsconfig.json で厳格な型チェックを有効にし、`any` 型の使用は避ける。
- TypeScript の型推論を活用し、不要な型注釈は避ける。
- すべての API アクセスは、src/lib/backend.ts の `accessBackend` 関数を使用する。
- Azure 環境では MSAL を使用して、API アクセスの認証を行う。ローカル環境では認証をスキップし、`X-User-Id: local` ヘッダーで API アクセスする。
- 必ず ESLint の警告・エラーを全て解消するように、コード品質を担保する。ESLint の静的解析は、以下のコマンドで実行する:
  ```bash
  npm run lint
  ```
- 以下の CI/CD パイプラインは GitHub Actions によって自動化する:
  - Azure Static Web Apps のデプロイ: .github/workflows/deploy-swa.yaml
  - Pull Request 発行時の ESLint 実行: .github/workflows/lint.yaml

## コミット・プルリクエストのワークフロー

### セキュリティ上の制約事項

機密情報を定義する`.env`、`.env.local` などのローカル環境変数ファイルは、リポジトリにコミットしないこと。

> [!NOTE]  
> フロントエンドアプリケーションは静的サイトとして配信されるため、すべての環境変数は公開情報となる。機密情報は環境変数に含めてはならない。

### プルリクエストの要件

プルリクエスト作成時は以下をすべて満たすこと:

- [ ] 以下のコマンドを実行して、ESLint の警告・エラーをすべて解消する:
  ```bash
  npm run lint
  ```
- [ ] 以下のコマンドで開発サーバーを起動して、実装した機能が正常に動作することを確認する:
  ```bash
  npm run dev
  ```
- [ ] ブラウザの開発者モードを用いて、モバイル/デスクトップでもレイアウトが崩れないレスポンシブデザインになっているか確認する。
- [ ] ターゲットを main ブランチに設定している。

## 依存関係管理

本システムでは、セキュリティの脆弱性や新機能に対応するように定期的にパッケージのバージョンアップを自動的に提案する GitHub の機能である GitHub Dependabot を使用して、依存関係を自動更新する。
GitHub Dependabot は以下の実行方式に従い、`.github/dependabot.yaml` で管理する。

### npm パッケージ管理

- 実行スケジュール: 毎週月曜日 10:30 (Asia/Tokyo)
- 対象ファイル: `package.json`, `package-lock.json`
- 更新方式: プルリクエストによる自動提案
- 除外パッケージ: 破壊的変更が多い以下のパッケージは管理対象外
  - `@types/node`
  - `@types/react`
  - `@types/react-dom`
  - `react`
  - `react-dom`
  - `react-router`
  - `typescript`

### GitHub Actions 管理

- 実行スケジュール: 毎週月曜日 11:30 (Asia/Tokyo)
- 対象ディレクトリ: `.github/workflows/`
- 更新方式: プルリクエストによる自動提案
