# 技術スタック

## フロントエンド

- Node.js 20.10.0 (Javascript ランタイム)
  - 破壊的変更が多いため、dependabot でのアップグレード更新対象外とする
- React 18.3.1 (Javascript フレームワーク)
  - 破壊的変更が多いため、dependabot でのアップグレード更新対象外とする
- TypeScript 5.5.3 (Javascript の型付けを強化したプログラミング言語)
  - 破壊的変更が多いため、dependabot でのアップグレード更新対象外とする
- Vite (ビルドツール)
- Tailwind CSS (CSS フレームワーク)
- shadcn/ui (UI コンポーネント)
- Radix UI (アクセシブルな UI コンポーネント)
- Jotai (状態管理)
- React Router (ルーティング)
  - 破壊的変更が多いため、dependabot でのアップグレード更新対象外とする
- Axios (HTTP クライアント)

## 認証

- Microsoft Authentication Library (MSAL) (Azure AD 認証)

## CI/CD

- GitHub Actions (自動化ワークフロー)
- GitHub Pages (静的サイトホスティング)

## 開発ツール

- ESLint (コード品質チェック)
- Prettier (コードフォーマッタ)

## 重要な制約事項

- 環境変数ファイル(.env)には公開可能な情報のみ含める
- Azure AD の認証情報は適切に管理する

## API 連携

[QuestionGPTTranslator](https://github.com/infhyroyage/QuestionGPTTranslator)を API サーバーとして利用する
API 仕様については[Swagger UI](https://infhyroyage.github.io/QuestionGPTTranslator/)を参照

## 開発ルール

- コンポーネントはなるべく小さく保ち、再利用可能にする
- 型定義は明確に行い、TypeScript の厳格な型チェックを活用する
- UI コンポーネントはアクセシビリティに配慮する
- 状態管理は Jotai を使用し、なるべくシンプルに保つ
- コードフォーマットは ESLint と Prettier のルールに従う
- 以下のコマンド実行で ESLint を実行し、警告・エラーを出力しないことを確認
  ```bash
  npm run lint
  ```
