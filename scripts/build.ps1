# A股数据平台 - Windows 构建脚本
# 使用方法: .\scripts\build.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Installing Node.js dependencies ===" -ForegroundColor Green
pnpm install --prefer-frozen-lockfile --prefer-offline

Write-Host "=== Generating Prisma Client ===" -ForegroundColor Green
npx prisma generate

Write-Host "=== Building the Next.js project ===" -ForegroundColor Green
pnpm next build

Write-Host "=== Bundling server with tsup ===" -ForegroundColor Green
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

Write-Host "=== Setting up Python data collector ===" -ForegroundColor Green
if (Test-Path "data-collector") {
    Set-Location data-collector
    
    if (-not (Test-Path ".venv")) {
        Write-Host "Creating Python virtual environment..."
        python -m venv .venv
    }
    
    # 激活虚拟环境
    & ".\.venv\Scripts\Activate.ps1"
    
    Write-Host "Installing Python dependencies..."
    python -m pip install --upgrade pip
    pip install akshare sqlalchemy psycopg2-binary pandas python-dotenv
    
    Set-Location ..
}

Write-Host "=== Build completed successfully! ===" -ForegroundColor Green
