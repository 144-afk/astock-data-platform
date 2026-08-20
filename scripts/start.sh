#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

cd "${COZE_WORKSPACE_PATH}"

echo "=== Initializing SQLite database ==="
# 确保 data 目录存在
mkdir -p data

# 初始化 Python 采集器的数据库表
if [ -d "data-collector/.venv" ]; then
    source data-collector/.venv/bin/activate
    cd data-collector
    python3 -c "
from database import init_db
init_db()
print('Python database tables initialized')
" || echo "Warning: Python database initialization skipped"
    cd ..
fi

echo "=== Starting HTTP service on port ${DEPLOY_RUN_PORT} ==="
PORT=${DEPLOY_RUN_PORT} node dist/server.js
