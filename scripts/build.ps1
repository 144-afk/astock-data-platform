$ErrorActionPreference = "Stop"

if (-not $env:COZE_WORKSPACE_PATH) {
    $env:COZE_WORKSPACE_PATH = (Get-Location).Path
}

Set-Location $env:COZE_WORKSPACE_PATH

Write-Host "=== Installing Node.js dependencies ==="
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

Write-Host "=== Generating Prisma Client ==="
npx prisma generate

Write-Host "=== Pushing Prisma schema to SQLite ==="
npx prisma db push

Write-Host "=== Building the Next.js project ==="
pnpm next build

Write-Host "=== Bundling server with tsup ==="
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

Write-Host "=== Setting up Python data collector ==="
if (Test-Path "data-collector") {
    Set-Location data-collector
    if (-not (Test-Path ".venv")) {
        Write-Host "Creating Python virtual environment..."
        python -m venv .venv
    }
    .\.venv\Scripts\Activate.ps1
    Write-Host "Installing Python dependencies..."
    python -m pip install --upgrade pip
    python -m pip install baostock sqlalchemy pandas python-dotenv
    Set-Location ..
}

Write-Host "=== Build completed successfully! ==="
