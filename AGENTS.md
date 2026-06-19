# AGENTS.md

## Cursor Cloud specific instructions

### プロジェクト概要

QuestionGPTPortal は、Azure OpenAI を活用した英語IT資格試験の学習支援Webアプリケーション。

- **フロントエンド**: `swa/` — React 19 + TypeScript + Vite + Tailwind CSS + daisyUI (ポート 5173)
- **バックエンド**: `functions/` — Python 3.12 Azure Functions (ポート 9229)
- **インフラ**: Docker Compose で CosmosDB Emulator (ポート 8081) + Azurite (ポート 10000-10002)

### サービス起動順序

1. Docker (`sudo dockerd` → `docker compose up`) — CosmosDB + Azurite
2. CosmosDB 初期化: `cd functions && python import_local.py` — DB/コンテナー作成
3. バックエンド: `source /workspace/venv/bin/activate && cd functions && func start --verbose`
4. フロントエンド: `cd swa && npm run dev`

### 重要な注意点

- **Docker in Docker**: `dockerd` の起動・`docker` コマンドは `sudo` が必要（例: `sudo dockerd`、`sudo docker compose up`）。`iptables-legacy` を使用する。
- **Docker ストレージドライバーは `vfs`**: `/etc/docker/daemon.json` に `{"storage-driver": "vfs"}` を設定済み。`fuse-overlayfs` だと CosmosDB Emulator (vnext-preview) 内部の PostgreSQL が起動時に `could not remove file "base/pgsql_job_cache": Invalid cross-device link` で失敗し、`pgcosmos extension is still starting` のまま使用不能になる。`vfs` に切り替えると `docker compose up` で `PostgreSQL=OK, Gateway=OK, Explorer=OK` となり正常に動作する。この設定は変更しないこと。
- **認証スキップ**: `import.meta.env.DEV` が true のとき MSAL 認証をスキップし、バックエンドへのリクエストに `X-User-Id: local` ヘッダーを付与する。
- **Node.js バージョン**: v24 が必要。`nvm use 24` で切り替え可能。
- **Python venv**: `/workspace/venv` に作成済み。`source /workspace/venv/bin/activate` で有効化。
- **`local.settings.json`**: `functions/local.settings.json` はローカル専用（.gitignore済み）。CosmosDB Emulator のデフォルトキーを使用。
- **`swa/.env`**: `VITE_API_URI="http://localhost:9229"` を設定（.gitignore済み）。
- **テストデータ**: `functions/data/(コース名)/(テスト名).json` に `list[ImportItem]` 形式の JSON を配置し `python functions/import_local.py` でインポート。`data/` は .gitignore 済み。UI を一通り動かすにはダミーのテストデータを 1 件以上入れておくと便利。
- **任意のクラウド機能**: 問題への回答（正解・解説生成）は Azure OpenAI、英日翻訳は Azure Translator が必要。`local.settings.json` の `OPENAI_*` / `TRANSLATOR_KEY` が空の場合これらは失敗し、UI に「翻訳失敗」やシステムエラーが出るが想定内。テスト一覧・問題閲覧・お気に入り・進捗などローカル完結の機能は Cosmos/Azurite だけで動作する。

### lint/test/build コマンド

`CONTRIBUTING.md` に記載の通り:

- **Python テスト**: `cd functions && coverage run -m unittest discover -s tests && coverage report -m`
- **Pylint**: `pylint functions/**/*.py`
- **ESLint**: `cd swa && npm run lint`
- **フロントエンドビルド**: `cd swa && npm run build`
