#!/bin/bash
# 数据采集运行脚本

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
            bash scripts/init-db.sh
            exit 0
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

# 检查 Python 虚拟环境
if [ ! -d "data-collector/.venv" ]; then
    echo "创建 Python 虚拟环境..."
    cd data-collector
    uv venv
    source .venv/bin/activate
    uv sync
    cd ..
else
    source data-collector/.venv/bin/activate
fi

# 加载环境变量
if [ -f "data-collector/.env" ]; then
    export $(grep -v '^#' data-collector/.env | xargs)
fi

# 运行采集脚本
cd data-collector
CMD="python collector.py --type $TYPE"
if [ -n "$DATE" ]; then
    CMD="$CMD --date $DATE"
fi

echo "执行: $CMD"
$CMD
