#!/usr/bin/env bash
#
# ローカル開発環境の起動スクリプト
# ---------------------------------------------------------------------------
# 以下をまとめて実行する（冪等。何度実行しても安全）:
#   1. 設定ファイルの用意
#        - functions/local.settings.json
#        - swa/.env
#      （既存ファイルは上書きしない）
#   2. Docker デーモンの起動（未起動の場合のみ）
#   3. docker compose による CosmosDB Emulator + Azurite の起動
#   4. CosmosDB Emulator の起動完了待機
#   5. CosmosDB へのサンプルデータインポート（functions/import_local.py）
#
# このスクリプトはバックエンド（func start）・フロントエンド（npm run dev）は
# 起動しない。完了後に表示される次の手順を参照すること。
#
# 使い方:
#   ./scripts/start-local.sh
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# CosmosDB Emulator のデフォルトキー（公開済みの固定値）
COSMOS_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="

log() { printf '\033[1;34m[start-local]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[start-local]\033[0m %s\n' "$*" >&2; }
err() { printf '\033[1;31m[start-local]\033[0m %s\n' "$*" >&2; }

# ---------------------------------------------------------------------------
# docker コマンド（sudo 要否を自動判定）
# ---------------------------------------------------------------------------
detect_docker() {
  if docker info >/dev/null 2>&1; then
    DOCKER=(docker)
    return 0
  fi
  if sudo -n docker info >/dev/null 2>&1 || sudo docker info >/dev/null 2>&1; then
    DOCKER=(sudo docker)
    return 0
  fi
  # デーモン未起動の可能性。sudo で扱える前提でセットしておく
  if command -v sudo >/dev/null 2>&1; then
    DOCKER=(sudo docker)
  else
    DOCKER=(docker)
  fi
  return 1
}

# ---------------------------------------------------------------------------
# Docker デーモンの起動（未起動の場合のみ）
# ---------------------------------------------------------------------------
ensure_docker_daemon() {
  if detect_docker; then
    log "Docker デーモンは起動済み"
    return 0
  fi

  log "Docker デーモンが未起動のため起動します..."
  if command -v dockerd >/dev/null 2>&1; then
    sudo bash -c 'nohup dockerd >/tmp/dockerd.log 2>&1 &'
  else
    err "dockerd が見つかりません。Docker をインストールしてください。"
    exit 1
  fi

  for _ in $(seq 1 30); do
    if detect_docker; then
      log "Docker デーモン起動完了"
      return 0
    fi
    sleep 1
  done

  err "Docker デーモンの起動に失敗しました。/tmp/dockerd.log を確認してください。"
  exit 1
}

# ---------------------------------------------------------------------------
# 設定ファイルの用意（既存は上書きしない）
# ---------------------------------------------------------------------------
prepare_settings_files() {
  local venv_python="$ROOT_DIR/venv/bin/python"

  if [ -f "functions/local.settings.json" ]; then
    log "functions/local.settings.json は既存のためスキップ"
  else
    log "functions/local.settings.json を作成"
    cat > functions/local.settings.json <<EOF
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "COSMOSDB_KEY": "${COSMOS_KEY}",
    "COSMOSDB_READONLY_KEY": "${COSMOS_KEY}",
    "COSMOSDB_URI": "http://localhost:8081",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "NODE_TLS_REJECT_UNAUTHORIZED": "0",
    "OPENAI_API_KEY": "dummy-openai-api-key",
    "OPENAI_API_VERSION": "2024-10-21",
    "OPENAI_DEPLOYMENT_NAME": "dummy-deployment",
    "OPENAI_ENDPOINT": "https://dummy.openai.azure.com",
    "OPENAI_MODEL_NAME": "gpt-4o",
    "PYTHON_PATH": "${venv_python}",
    "TRANSLATOR_KEY": "dummy-translator-key"
  },
  "Host": {
    "CORS": "*",
    "LocalHttpPort": 9229
  },
  "ConnectionStrings": {}
}
EOF
    warn "OPENAI_* / TRANSLATOR_KEY はダミー値です。AI 機能（解説生成・翻訳）を使う場合は実際の Azure の値に置き換えてください。"
  fi

  if [ -f "swa/.env" ]; then
    log "swa/.env は既存のためスキップ"
  else
    log "swa/.env を作成"
    cat > swa/.env <<'EOF'
VITE_API_URI="http://localhost:9229"
EOF
  fi
}

# ---------------------------------------------------------------------------
# CosmosDB Emulator + Azurite の起動
# ---------------------------------------------------------------------------
start_containers() {
  log "docker compose で CosmosDB Emulator + Azurite を起動..."
  "${DOCKER[@]}" compose up -d
}

# ---------------------------------------------------------------------------
# CosmosDB Emulator の起動完了待機（内蔵 PostgreSQL の準備完了を待つ）
# ---------------------------------------------------------------------------
wait_for_cosmos() {
  log "CosmosDB Emulator の起動完了を待機中（最大 5 分）..."
  for _ in $(seq 1 150); do
    if "${DOCKER[@]}" logs localcosmosdb 2>&1 | grep -q "PostgreSQL=OK"; then
      log "CosmosDB Emulator 起動完了（PostgreSQL=OK）"
      return 0
    fi
    sleep 2
  done
  err "CosmosDB Emulator の起動待機がタイムアウトしました。'${DOCKER[*]} logs localcosmosdb' を確認してください。"
  return 1
}

# ---------------------------------------------------------------------------
# Python 仮想環境の確認（無ければ作成して依存をインストール）
# ---------------------------------------------------------------------------
ensure_venv() {
  if [ -x "venv/bin/python" ]; then
    return 0
  fi
  log "Python 仮想環境 (venv) が無いため作成します..."
  if command -v python3.12 >/dev/null 2>&1; then
    python3.12 -m venv venv
  else
    python3 -m venv venv
  fi
  ./venv/bin/pip install --quiet --upgrade pip
  ./venv/bin/pip install --quiet -r requirements.txt
}

# ---------------------------------------------------------------------------
# サンプルデータのインポート
# ---------------------------------------------------------------------------
import_data() {
  if [ ! -d "functions/data" ]; then
    warn "functions/data が存在しません。インポートデータが無いため DB/コンテナーの作成のみ行います。"
    warn "問題データを投入するには functions/data/<コース名>/<テスト名>.json を配置して再実行してください。"
  fi
  log "CosmosDB へデータをインポート..."
  ./venv/bin/python functions/import_local.py
}

# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------
main() {
  ensure_docker_daemon
  prepare_settings_files
  start_containers
  wait_for_cosmos
  ensure_venv
  import_data

  cat <<'NEXT'

[start-local] 完了しました。

次の手順でバックエンド・フロントエンドを起動してください:

  # バックエンド (Azure Functions / port 9229)
  source venv/bin/activate
  cd functions && func start --verbose

  # フロントエンド (Vite / port 5173) ※別ターミナル
  cd swa && npm run dev

NEXT
}

main "$@"
