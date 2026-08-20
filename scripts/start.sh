#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

cd "${COZE_WORKSPACE_PATH}"

echo "=== Initializing database ==="
# 如果提供了 DATABASE_URL，尝试初始化数据库表
if [ -n "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URL is set, initializing database tables..."
    if [ -d "data-collector/.venv" ]; then
        source data-collector/.venv/bin/activate
        cd data-collector
        python3 -c "
from database import init_db
init_db()
print('Database tables initialized successfully')
" || echo "Warning: Database initialization failed, continuing without database..."
        cd ..
    fi
else
    echo "Warning: DATABASE_URL not set, skipping database initialization"
    echo "Set DATABASE_URL environment variable to enable data collection"
fi

echo "=== Starting HTTP service on port ${DEPLOY_RUN_PORT} ==="
PORT=${DEPLOY_RUN_PORT} node dist/server.js
