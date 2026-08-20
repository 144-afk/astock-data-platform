# A股数据平台 - Windows 启动脚本
# 使用方法: .\scripts\start.ps1
# 环境变量: $env:DATABASE_URL = "postgresql://user:password@localhost:5432/a_stock_data"

$ErrorActionPreference = "Stop"

$Port = 5000
if ($env:DEPLOY_RUN_PORT) {
    $Port = $env:DEPLOY_RUN_PORT
}

Write-Host "=== Initializing database ===" -ForegroundColor Green

# 如果设置了 DATABASE_URL，尝试初始化数据库表
if ($env:DATABASE_URL) {
    Write-Host "DATABASE_URL is set, initializing database tables..."
    
    if (Test-Path "data-collector\.venv") {
        Set-Location data-collector
        & ".\.venv\Scripts\Activate.ps1"
        
        try {
            python -c @"
from database import init_db
init_db()
print('Database tables initialized successfully')
"@
        } catch {
            Write-Host "Warning: Database initialization failed, continuing without database..." -ForegroundColor Yellow
        }
        
        Set-Location ..
    }
} else {
    Write-Host "Warning: DATABASE_URL not set, skipping database initialization" -ForegroundColor Yellow
    Write-Host "Set DATABASE_URL environment variable to enable data collection"
    Write-Host "Example: `$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/a_stock_data'"
}

Write-Host "=== Starting HTTP service on port $Port ===" -ForegroundColor Green
$env:PORT = $Port
node dist/server.js
