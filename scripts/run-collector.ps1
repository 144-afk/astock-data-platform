# A股数据采集脚本 - Windows 版本 (SQLite)
# 使用方法:
#   .\scripts\run-collector.ps1                    # 采集今日数据
#   .\scripts\run-collector.ps1 -Date "2024-01-15" # 采集指定日期
#   .\scripts\run-collector.ps1 -Type "daily"      # 只采集日K线
#   .\scripts\run-collector.ps1 -Type "dragon"     # 只采集龙虎榜
#   .\scripts\run-collector.ps1 -InitDb            # 初始化数据库

param(
    [string]$Date,
    [string]$Type = "all",
    [switch]$InitDb
)

$ErrorActionPreference = "Stop"

# 确保 data 目录存在
if (-not (Test-Path "data-collector\data")) {
    New-Item -ItemType Directory -Path "data-collector\data" | Out-Null
}

# 初始化数据库
if ($InitDb) {
    Write-Host "=== Initializing database ===" -ForegroundColor Green
    
    Set-Location data-collector
    
    if (-not (Test-Path ".venv")) {
        Write-Host "Creating Python virtual environment..."
        python -m venv .venv
    }
    
    & ".\.venv\Scripts\Activate.ps1"
    
    python -c @"
from database import init_db
init_db()
print('Database tables created successfully')
"@
    
    Set-Location ..
    Write-Host "=== Database initialization complete ===" -ForegroundColor Green
    exit 0
}

# 检查虚拟环境
if (-not (Test-Path "data-collector\.venv")) {
    Write-Host "Error: Python virtual environment not found. Run with -InitDb first." -ForegroundColor Red
    exit 1
}

# 激活虚拟环境
Set-Location data-collector
& ".\.venv\Scripts\Activate.ps1"

# 构建命令
$cmd = "python collector.py --type $Type"
if ($Date) {
    $cmd = "$cmd --date $Date"
}

Write-Host "=== Running data collector ===" -ForegroundColor Green
Write-Host "Command: $cmd"

# 执行采集
Invoke-Expression $cmd

Set-Location ..
Write-Host "=== Collection complete ===" -ForegroundColor Green
