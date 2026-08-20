# A股数据平台 - Windows 启动脚本 (SQLite 版本)
# 使用方法: .\scripts\start.ps1

$ErrorActionPreference = "Stop"

$Port = 5000
if ($env:DEPLOY_RUN_PORT) {
    $Port = $env:DEPLOY_RUN_PORT
}

Write-Host "=== Initializing SQLite database ===" -ForegroundColor Green

# 确保 data 目录存在
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
}

# 初始化 Python 采集器的数据库表
if (Test-Path "data-collector\.venv") {
    Set-Location data-collector
    & ".\.venv\Scripts\Activate.ps1"
    
    try {
        python -c @"
from database import init_db
init_db()
print('Python database tables initialized')
"@
    } catch {
        Write-Host "Warning: Python database initialization skipped" -ForegroundColor Yellow
    }
    
    Set-Location ..
}

Write-Host "=== Starting HTTP service on port $Port ===" -ForegroundColor Green
$env:PORT = $Port
node dist/server.js
