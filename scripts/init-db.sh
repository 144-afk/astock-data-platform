#!/bin/bash
# 数据库初始化脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=== 初始化数据库 ==="

# 检查环境变量
if [ ! -f "data-collector/.env" ]; then
    echo "创建 .env 文件..."
    cp data-collector/.env.example data-collector/.env
fi

# 加载环境变量
export $(grep -v '^#' data-collector/.env | xargs)

echo "数据库连接: $DATABASE_URL"

# 使用 Python 初始化数据库表
cd data-collector
python3 -c "
from database import init_db
init_db()
print('数据库表创建成功')
"

echo "=== 数据库初始化完成 ==="
