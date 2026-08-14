# Contribution Guide

## 開発ツール

本システムの開発には、以下のツールとテクノロジーを使用する:

- フロントエンド
  - Node.js v24 (TypeScript ランタイム)
  - React + TypeScript (フロントエンドフレームワーク)
  - Vite (ビルドツール・開発サーバー)
  - ESLint (コード静的解析)
  - Tailwind CSS + daisyUI (UI コンポーネントライブラリ)
  - Jotai (状態管理)
  - React Router (ルーティング)
  - Axios (HTTP クライアント)
  - MSAL (Entra ID 認証)
- バックエンド
  - Python 3.12 (プログラミング言語)
  - uv (Python パッケージ管理)
  - Azure Functions Core Tools (ローカルテストとデプロイ)
  - Docker/Docker Compose (ローカル開発環境構築)
  - coverage (ユニットテスト・カバレッジ測定)
  - pylint (コード静的解析)
  - Swagger/OpenAPI 3.0 (API ドキュメント管理)

## ローカル開発環境のセットアップ

[localenvironment.md](localenvironment.md) 参照。

## 開発時の実装規則

コード品質と一貫性を確保するため、以下の実装規則に従う:

- ほとんどのインフラストラクチャは Infrastructure as Code (IaC) で管理し、手動構成は行わない。本システムでは、Azure Bicep テンプレートで以下の Azure リソースを定義する:
  - Azure API Management
  - Azure Functions・App Service Plan
  - Azure Storage Account (Blob Storage・Queue Storage)
  - Azure Event Grid
  - Azure Cosmos DB
  - Azure Key Vault
  - Azure Application Insights
  - Azure OpenAI
  - Azure Static Web Apps
  - Azure Translator
- 関数アプリは Python 3.12 を用いて実装する。
- 関数アプリの各エントリーポイントは、functions/function_app.py にブループリントを登録する。
- 関数アプリは、functions/src ディレクトリに個別ファイルで実装する。
- 関数アプリ間で共通する処理は functions/util ディレクトリにユーティリティ関数として実装する。
- 関数アプリで使用する以下の型定義は、 functions/type ディレクトリ配下に Pydanticm モデルとして定義する。
  - API リクエストデータ： functions/type/request.py
  - API レスポンスデータ： functions/type/response.py
  - Azure Cosmos DB のドキュメント構造： functions/type/cosmos.py
  - Azure OpenAI Structured Outputs： functions/type/structured.py
- 関数アプリの Python のユニットテストは functions/tests に実装し、stmt のカバレッジ率 80%以上をみたすようにして、コード品質を担保する。ユニットテストは、以下のコマンドで実行する:
  ```bash
  cd functions && uv sync --locked --all-groups && uv run coverage run -m unittest discover -s tests && uv run coverage report -m && cd ..
  ```
- 関数アプリの開発時は、.pylintrc に記載した例外を除き、必ず Pylint の警告・エラーをすべて解消するように、コード品質を担保する。Pylint の静的解析は、以下のコマンドで実行する:
  ```bash
  uv sync --locked --all-groups && uv run pylint functions/**/*.py
  ```
- HTTP Trigger 関数の関数アプリの API リファレンスは Swagger ファイルとして、基本的に apim/apis-functions-swagger.yaml で管理する。ただし、ヘルスチェック API のみ認証処理を行わないため、別の Swagger ファイル apim/apis-healthcheck-functions-swagger.yaml で管理する。
  - API Management のデプロイは、これらの Swagger ファイルをインポートする。
- Microsoft ID Platform で Entra ID で認証して発行したアクセストークン(JWT)は、`X-User-Id` ヘッダーに設定された状態で Azure API Management のポリシー設定により検証される。
- Azure Cosmos DB には強い整合性を採用して、確実な重複防止を保証する。
- Azure OpenAI は、以下の機能を利用する。
  - Structured Outputs
  - Vision-enabled
- 長い実行時間を要求される生成 AI の処理が含まれている API には、Queue Storage キュートリガー関数にて Azure Cosmos DB に保存する非同期処理を採用する。
- 英語 → 日本語の翻訳システムは、Azure Translator (Standard Tier) を採用する。
- フロントエンドは、React を用いた Single Page Application(SPA)として構築し、ルーティング機能を持つ Azure Static Web Apps 上でホスティングする。
- フロントエンドは TypeScript で実装し、厳格な型チェックを有効にすることで`any` 型の使用は避ける。Typescript の型定義ファイルは、以下の通りに分類して swa/src/types ディレクトリに配置する:
  - atoms.ts: Jotai の Atom 関連の型定義
  - backend.ts: バックエンド API の型定義
  - props.ts: コンポーネントの props の型定義
- フロントエンドアプリケーションで再利用可能なコンポーネントは、swa/src/components ディレクトリに配置する。
- フロントエンドのスタイリングは Tailwind CSS のユーティリティクラスを使用でき、レスポンシブなレイアウトにするようにする。
- フロントエンドの UI コンポーネントライブラリとして daisyUI を採用する。Tailwind CSS v4 の `swa/src/index.css` で `@plugin "daisyui"` を有効化し、`light` / `dark` テーマを利用する。
- daisyUI のユーティリティクラス（`btn`、`modal`、`drawer`、`collapse`、`skeleton` など）は各コンポーネントから直接利用する。React 向けの薄いラッパー（`Button`、`Tooltip`、`Toaster`、`Resizable` など）は `swa/src/components` ディレクトリに配置する。
- ダークモード切替は `html` 要素の `data-theme` 属性（`light` / `dark`）で制御する。
- フロントエンドの React Router で定義するルート単位のページコンポーネントは swa/src/pages ディレクトリに配置する。
- フロントエンドのユーティリティ関数、API 通信、状態管理に要する処理などは swa/src/lib ディレクトリに配置する。
- フロントエンドの React のカスタムフックは swa/src/hooks ディレクトリに配置する。
- フロントエンドの状態管理ライブラリとして jotai を採用し、以下のルールを設ける。
  - Atom 名は`{機能名}Atom` の形式で命名する(例:`testDetailsAtom`)。
  - API アクセスを含む非同期処理は Atom の write 関数で実装する。
- Azure 環境では、フロントエンドで MSAL を使用し、API アクセスの認証を行う。一方、ローカル環境では認証をスキップし、`X-User-Id: local` ヘッダーを付与して API アクセスする。
- フロントエンドの開発時は、必ず ESLint の警告・エラーを全て解消するように、コード品質を担保する。ESLint の静的解析は、以下のコマンドで実行する:
  ```bash
  cd swa && npm run lint && cd ..
  ```
- 以下の CI/CD パイプラインは GitHub Actions によって自動化する:
  - 全 Azure リソースデプロイ: .github/workflows/create-azure-resources.yaml
  - 関数アプリのみのデプロイ: .github/workflows/deploy-functions-app.yaml
  - API Management のみのデプロイ: .github/workflows/deploy-apim.yaml
  - フロントエンドのみのデプロイ: .github/workflows/deploy-swa.yaml
  - シークレット日次再発行: .github/workflows/regenerate-secrets.yaml
  - Pull Request 発行時のユニットテスト・Pylint・ESLint 実行: .github/workflows/test-lint.yaml

## 新しい機能の追加手順

### API エンドポイントの新設

1. functions/src に関数ファイルを新設
2. functions/function_app.py にブループリント登録
3. apim/apis-functions-swagger.yaml に API 定義追加
4. functions/type、swa/src/types/backend.ts に型定義を追加
5. functions/tests にユニットテストを追加

### CosmosDB コンテナーの新設

1. functions/type/cosmos.py に Azure 環境用の型定義を追加
2. functions/util/local.py にローカル環境用の型定義を追加
3. functions/tests にユニットテストを追加

## コミット・プルリクエストのワークフロー

### セキュリティ上の制約事項

以下の機密情報は Azure Key Vault で安全に管理するため、リポジトリにコミットしないこと:

- Azure OpenAI の API キー
- Azure Translator の API キー
- Azure Cosmos DB の API キー

また、以下のファイルはローカル環境で管理するため、リポジトリにコミットしないこと:

- local.settings.json (ローカル開発時の関数アプリの環境変数)
- swa/.env (ローカル開発時のフロントエンドの環境変数)
- data/(コース名)/(テスト名).json (インポートデータファイル)

### プルリクエストの要件

プルリクエスト作成時は以下をすべて満たすこと:

- [ ] 以下のコマンドを実行して、すべての関数アプリのユニットテストが成功し、カバレッジを 80% 以上にする:
  ```bash
  cd functions && uv sync --locked --all-groups && uv run coverage run -m unittest discover -s tests && uv run coverage report -m && cd ..
  ```
- [ ] 以下のコマンドを実行して、Pylint の警告・エラーをすべて解消する:
  ```bash
  uv sync --locked --all-groups && uv run pylint functions/**/*.py
  ```
- [ ] 以下のコマンドを実行して、ESLint の警告・エラーをすべて解消する:
  ```bash
  cd swa && npm run lint && cd ..
  ```
- [ ] ターゲットを main ブランチに設定している。

## 依存関係管理

本システムでは uv を用いて Python パッケージの依存関係を `pyproject.toml` と `uv.lock` で管理する。
セキュリティの脆弱性や新機能に対応するように定期的にパッケージのバージョンアップを自動的に提案する GitHub Dependabot を使用して、依存関係を自動更新する。
GitHub Dependabot は以下の実行方式に従い、`.github/dependabot.yaml` で管理する。

### PyPI パッケージ管理

- 実行スケジュール: 毎週月曜日 10:00 (Asia/Tokyo)
- 対象ファイル: `pyproject.toml`、`uv.lock`
- 更新方式: プルリクエストによる自動提案
- 除外パッケージ: 破壊的変更が多い以下のパッケージは管理対象外
  - `openai`

### npm パッケージ管理

- 実行スケジュール: 毎週月曜日 10:30 (Asia/Tokyo)
- 対象ファイル: `swa/package.json`、`swa/package-lock.json`
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

- 実行スケジュール: 毎週月曜日 11:00 (Asia/Tokyo)
- 対象ディレクトリ: `.github/workflows/`
- 更新方式: プルリクエストによる自動提案
