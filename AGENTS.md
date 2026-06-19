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

- **Docker in Docker**: このVM環境では `fuse-overlayfs` ストレージドライバーと `iptables-legacy` が必要。`/etc/docker/daemon.json` に `{"storage-driver": "fuse-overlayfs"}` を設定済み。Docker デーモンは `sudo dockerd` で起動し、`docker` コマンドは `sudo` 付きで実行する。
- **CosmosDB Emulator の fuse-overlayfs 対策**: `fuse-overlayfs` 上では CosmosDB Emulator 内蔵 PostgreSQL が `could not remove file "base/pgsql_job_cache": Invalid cross-device link` で起動失敗する。リポジトリ直下の `compose.override.yaml`（`docker compose up` が自動マージ）で名前付きボリューム `cosmosdb-data` を `/data` にマウントし、データディレクトリを fuse-overlayfs レイヤーから外すことで回避している。ボリュームは必ず `/data` にマウントすること（`/data/db` だと entrypoint が initdb をスキップして失敗する）。`PostgreSQL=OK, Gateway=OK, Explorer=OK` のログが出れば起動完了。
- **認証スキップ**: `import.meta.env.DEV` が true のとき MSAL 認証をスキップし、バックエンドへのリクエストに `X-User-Id: local` ヘッダーを付与する。
- **Node.js バージョン**: v24 が必要。`nvm use 24` で切り替え可能。
- **Python venv**: `/workspace/venv` に作成済み。`source /workspace/venv/bin/activate` で有効化。
- **`local.settings.json`**: `functions/local.settings.json` はローカル専用（.gitignore済み）。CosmosDB Emulator のデフォルトキーを使用。
- **`swa/.env`**: `VITE_API_URI="http://localhost:9229"` を設定（.gitignore済み）。
- **テストデータ**: `functions/data/` に JSON ファイルを配置し `python functions/import_local.py` でインポート。`data/` は .gitignore 済み。

### lint/test/build コマンド

`CONTRIBUTING.md` に記載の通り:

- **Python テスト**: `cd functions && coverage run -m unittest discover -s tests && coverage report -m`
- **Pylint**: `pylint functions/**/*.py`
- **ESLint**: `cd swa && npm run lint`
- **フロントエンドビルド**: `cd swa && npm run build`
