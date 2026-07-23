# AGENTS.md

## Cursor Cloud specific instructions

### プロジェクト概要

QuestionGPTPortal は、Azure OpenAI を活用した英語IT資格試験の学習支援Webアプリケーション。

- **フロントエンド**: `swa/` — React 19 + TypeScript + Vite + Tailwind CSS + daisyUI (ポート 5173)
- **バックエンド**: `functions/` — Python 3.12 Azure Functions (ポート 9229)
- **インフラ**: Docker Compose で CosmosDB Emulator (ポート 8081) + Azurite (ポート 10000-10002)

### 前提（初回 VM のみ）

[uv](https://docs.astral.sh/uv/) をインストールする（未導入時）:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
```

### 仮想環境と依存関係

パッケージ管理には **uv** を使用する（`pyproject.toml` / `uv.lock`）。

```bash
cd /workspace
uv sync --locked --all-groups
```

以降のセッションでは `source .venv/bin/activate` を先に実行するか、各コマンドを `uv run` 経由で実行すること。

### サービス起動順序

1. Docker (`sudo dockerd` → `docker compose up`) — CosmosDB + Azurite
2. CosmosDB 初期化: `uv run python functions/import_local.py` — DB/コンテナー作成
3. バックエンド: `source .venv/bin/activate && cd functions && func start --verbose`
4. フロントエンド: `cd swa && npm run dev`

### 重要な注意点

- **Docker in Docker**: `dockerd` の起動・`docker` コマンドは `sudo` が必要 (例: `sudo dockerd`、`sudo docker compose up`) 。ストレージドライバーは `fuse-overlayfs`、`iptables-legacy` を使用する (`/etc/docker/daemon.json` に設定済み) 。
- **CosmosDB Emulator の PostgreSQL 起動対策**: `fuse-overlayfs` 環境では、イメージ下位レイヤー上のファイル削除が `could not remove file "base/pgsql_job_cache": Invalid cross-device link` (EXDEV) となり、内蔵 PostgreSQL が起動失敗 (`pgcosmos extension is still starting` のまま使用不能) する。これを回避するため、`compose.yaml` で CosmosDB の `/data` を名前付きボリューム `cosmosdata` にマウントしている (名前付きボリュームはイメージ内の初期化済み `/data` を自動コピーし、実ファイルシステム上で動作するため EXDEV を回避できる) 。正常起動時は `docker compose up` のログに `PostgreSQL=OK, Gateway=OK, Explorer=OK` が出る。ボリュームを完全に作り直したい場合のみ `docker compose down -v` を使う。
- **認証スキップ**: `import.meta.env.DEV` が true のとき MSAL 認証をスキップし、バックエンドへのリクエストに `X-User-Id: local` ヘッダーを付与する。
- **Node.js バージョン**: v24 が必要。`nvm use 24` で切り替え可能。
- **Python / uv**: `uv sync --locked --all-groups` で `.venv` を作成。`source .venv/bin/activate` または `uv run` で実行。
- **`local.settings.json`**: `functions/local.settings.json` はローカル専用 (.gitignore済み) 。CosmosDB Emulator のデフォルトキーを使用。`PYTHON_PATH` は `../.venv/bin/python` を指定。
- **`swa/.env`**: `VITE_API_URI="http://localhost:9229"` を設定 (.gitignore済み) 。
- **テストデータ**: `functions/data/(コース名)/(テスト名).json` に `list[ImportItem]` 形式の JSON を配置し `uv run python functions/import_local.py` でインポート。`data/` は .gitignore 済み。UI を一通り動かすにはダミーのテストデータを 1 件以上入れておくと便利。
- **任意のクラウド機能**: 問題への回答 (正解・解説生成) は Azure OpenAI、英日翻訳は Azure Translator が必要。`local.settings.json` の `OPENAI_*` / `TRANSLATOR_KEY` が空の場合これらは失敗し、UI に「翻訳失敗」やシステムエラーが出るが想定内。テスト一覧・問題閲覧・お気に入り・進捗などローカル完結の機能は Cosmos/Azurite だけで動作する。

### lint/test/build コマンド

`CONTRIBUTING.md` に記載の通り:

- **Python テスト**: `cd functions && uv run coverage run -m unittest discover -s tests && uv run coverage report -m`
- **Pylint**: `uv run pylint functions/**/*.py`
- **ESLint**: `cd swa && npm run lint`
- **フロントエンドビルド**: `cd swa && npm run build`
