#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "=== Installing Node.js dependencies ==="
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "=== Generating Prisma Client ==="
npx prisma generate

echo "=== Pushing Prisma schema to SQLite ==="
npx prisma db push

echo "=== Building the Next.js project ==="
pnpm next build

echo "=== Bundling server with tsup ==="
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

echo "=== Setting up Python data collector ==="
if [ -d "data-collector" ]; then
    cd data-collector
    if [ ! -d ".venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv .venv
    fi
    source .venv/bin/activate
    echo "Installing Python dependencies..."
    pip install --upgrade pip
    pip install akshare sqlalchemy pandas python-dotenv
    cd ..
fi

echo "=== Build completed successfully! ==="
