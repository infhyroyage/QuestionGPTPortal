# ディレクトリ構成

以下のディレクトリ構造に従って実装を行ってください：

```
/
├── .cursor/                               # Cursor IDE設定
│   └── rules/                             # Project Rules
│       └── global.mdc                     # グローバルルール設定
├── .git/                                  # Gitリポジトリ
├── .github/                               # GitHub連携設定
│   ├── workflows/                         # GitHub Actionsワークフロー
│   │   ├── build-deploy-pages.yaml        # GitHub Pages自動ビルド・デプロイワークフロー
│   │   ├── lint.yaml                      # Pull Request発行時のlint実行ワークフロー
│   │   └── scan-codeql.yaml               # Pull Request発行時のCodeQLによるセキュリティスキャン
│   ├── CODEOWNERS                         # コードオーナー設定
│   └── dependabot.yaml                    # 依存関係自動更新設定
├── src/                                   # ソースコード
│   ├── components/                        # Reactコンポーネント
│   ├── hooks/                             # カスタムフック
│   ├── lib/                               # ユーティリティ関数・定数
│   ├── pages/                             # ページコンポーネント
│   ├── types/                             # 型定義
│   ├── App.tsx                            # アプリケーションのルートコンポーネント
│   ├── index.css                          # グローバルCSS
│   ├── main.tsx                           # エントリーポイント
│   └── vite-env.d.ts                      # Vite環境変数の型定義
├── node_modules/                          # npmパッケージ
├── .env                                   # 環境変数
├── .gitignore                             # Git管理除外設定
├── .prettierrc.yaml                       # Prettier設定
├── LICENSE                                # ライセンス情報
├── README.md                              # プロジェクト概要説明
├── azureenvironment.md                    # Azure環境構築手順・削除手順
├── components.json                        # shadcn/uiのコンポーネント設定
├── directorystructure.md                  # ディレクトリ構成
├── eslint.config.js                       # ESLint設定
├── index.html                             # HTMLエントリーポイント
├── localenvironment.md                    # ローカル環境構築手順・削除手順
├── package-lock.json                      # npmパッケージのロックファイル
├── package.json                           # npmパッケージ設定
├── postcss.config.js                      # PostCSS設定
├── tailwind.config.js                     # Tailwind CSS設定
├── technologystack.md                     # 技術スタック情報
├── tsconfig.app.json                      # TypeScript設定（アプリケーション用）
├── tsconfig.json                          # TypeScript設定（ベース）
├── tsconfig.node.json                     # TypeScript設定（Node.js用）
└── vite.config.ts                         # Vite設定
```
