#!/bin/bash
# 数据采集运行脚本 (SQLite 版本)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# 默认参数
DATE=""
TYPE="all"

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --date)
            DATE="$2"
            shift 2
            ;;
        --type)
            TYPE="$2"
            shift 2
            ;;
        --init-db)
            # 确保 data 目录存在
            mkdir -p data-collector/data
            cd data-collector
            if [ ! -d ".venv" ]; then
                echo "Creating Python virtual environment..."
                python3 -m venv .venv
            fi
            source .venv/bin/activate
            python3 -c "
from database import init_db
init_db()
print('Database tables created successfully')
"
            exit 0
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

# 确保 data 目录存在
mkdir -p data-collector/data

# 检查 Python 虚拟环境
if [ ! -d "data-collector/.venv" ]; then
    echo "Error: Python virtual environment not found. Run with --init-db first."
    exit 1
fi

source data-collector/.venv/bin/activate

# 运行采集脚本
cd data-collector
CMD="python collector.py --type $TYPE"
if [ -n "$DATE" ]; then
    CMD="$CMD --date $DATE"
fi

echo "执行: $CMD"
$CMD
