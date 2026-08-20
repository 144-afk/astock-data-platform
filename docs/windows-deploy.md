# Windows 11 部署指南 (SQLite 版本)

## 环境要求

- Windows 11
- Node.js 24+ ([下载](https://nodejs.org/))
- Python 3.12+ ([下载](https://www.python.org/downloads/))

> **注意**: SQLite 版本无需安装 PostgreSQL，数据库文件自动创建在项目目录中。

## 安装步骤

### 1. 安装 Node.js 和 Python

1. 下载并安装 [Node.js 24+](https://nodejs.org/)
2. 下载并安装 [Python 3.12+](https://www.python.org/downloads/)
   - 安装时勾选 "Add Python to PATH"

### 2. 安装 pnpm

打开 PowerShell，运行：
```powershell
npm install -g pnpm
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

## 数据库文件位置

SQLite 数据库文件位于：
- Web 端: `prisma/data/a_stock_data.db`
- Python 采集端: `data-collector/data/a_stock_data.db`

> **提示**: 两端使用同一个数据库文件，数据自动同步。

## 常见问题

### PowerShell 执行策略

如果提示"无法加载文件，因为在此系统上禁止运行脚本"，需要修改执行策略：

```powershell
# 以管理员身份运行 PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Python 虚拟环境问题

如果虚拟环境出问题，可以删除重建：

```powershell
Remove-Item -Recurse -Force data-collector\.venv
.\scripts\run-collector.ps1 -InitDb
```

### 数据库锁定

如果出现数据库锁定错误，确保没有其他程序正在访问数据库文件。

## 设置开机自启（可选）

创建计划任务实现开机自动启动：

```powershell
# 创建启动脚本
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Hidden -File C:\path\to\astock-data-platform\scripts\start.ps1"
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "AStockDataPlatform" -Action $action -Trigger $trigger -User "SYSTEM"
```

## 数据备份

SQLite 数据库是单个文件，备份只需复制数据库文件：

```powershell
Copy-Item "data-collector\data\a_stock_data.db" "backup\a_stock_data_$(Get-Date -Format 'yyyyMMdd').db"
```
