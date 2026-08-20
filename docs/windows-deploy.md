# Windows 11 部署指南

## 环境要求

- Windows 11
- Node.js 24+ ([下载](https://nodejs.org/))
- Python 3.12+ ([下载](https://www.python.org/downloads/))
- PostgreSQL 16+ ([下载](https://www.postgresql.org/download/windows/))

## 安装步骤

### 1. 安装 PostgreSQL

1. 下载并安装 PostgreSQL
2. 安装时设置 postgres 用户密码（记住这个密码）
3. 安装完成后，打开 pgAdmin 或命令行创建数据库：

```sql
CREATE DATABASE a_stock_data;
```

### 2. 配置环境变量

打开 PowerShell，设置环境变量：

```powershell
# 临时设置（当前会话有效）
$env:DATABASE_URL = "postgresql://postgres:你的密码@localhost:5432/a_stock_data"

# 永久设置（推荐）
[System.Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql://postgres:你的密码@localhost:5432/a_stock_data", "User")
```

### 3. 构建项目

```powershell
# 进入项目目录
cd astock-data-platform

# 运行构建脚本
.\scripts\build.ps1
```

### 4. 初始化数据库

```powershell
# 初始化数据库表
.\scripts\run-collector.ps1 -InitDb
```

### 5. 启动服务

```powershell
.\scripts\start.ps1
```

服务将在 http://localhost:5000 启动。

## 数据采集

```powershell
# 采集今日数据
.\scripts\run-collector.ps1

# 采集指定日期
.\scripts\run-collector.ps1 -Date "2024-01-15"

# 只采集日K线
.\scripts\run-collector.ps1 -Type "daily"

# 只采集龙虎榜
.\scripts\run-collector.ps1 -Type "dragon"
```

## 常见问题

### PowerShell 执行策略

如果提示"无法加载文件，因为在此系统上禁止运行脚本"，需要修改执行策略：

```powershell
# 以管理员身份运行 PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### PostgreSQL 连接失败

1. 检查 PostgreSQL 服务是否运行：`Get-Service postgresql*`
2. 检查密码是否正确
3. 检查数据库是否存在

### Python 虚拟环境问题

如果虚拟环境出问题，可以删除重建：

```powershell
Remove-Item -Recurse -Force data-collector\.venv
.\scripts\run-collector.ps1 -InitDb
```

## 设置开机自启（可选）

创建计划任务实现开机自动启动：

```powershell
# 创建启动脚本
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Hidden -File C:\path\to\astock-data-platform\scripts\start.ps1"
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "AStockDataPlatform" -Action $action -Trigger $trigger -User "SYSTEM"
```
