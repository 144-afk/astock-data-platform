# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

## 数据采集模块

### 技术栈
- **语言**: Python 3.12
- **数据源**: AKShare（A股免费数据接口）
- **数据库**: SQLite（轻量级，无需额外安装）
- **ORM**: SQLAlchemy 2.0

### 目录结构
```
├── data-collector/           # Python 数据采集模块
│   ├── collector.py          # 采集器主程序
│   ├── models.py             # 数据库模型
│   ├── database.py           # 数据库连接
│   ├── pyproject.toml        # Python 依赖
│   ├── data/                 # SQLite 数据库文件
│   └── .env                  # 环境变量（不提交）
├── prisma/                   # Prisma ORM（Next.js 后端）
│   └── schema.prisma         # 数据库 Schema
└── scripts/
    ├── build.sh / build.ps1  # 构建脚本
    ├── start.sh / start.ps1  # 启动脚本
    └── run-collector.sh / .ps1  # 采集器运行脚本
```

### 数据类型
- **stock_daily**: 股票日K线数据（全市场）
- **dragon_tiger_list**: 龙虎榜上榜数据
- **dragon_tiger_detail**: 龙虎榜营业部明细
- **collection_log**: 采集日志

### 运行采集
```bash
# 初始化数据库
bash scripts/run-collector.sh --init-db

# 采集今日数据
bash scripts/run-collector.sh

# 采集指定日期
bash scripts/run-collector.sh --date 2024-01-15

# 只采集日K线
bash scripts/run-collector.sh --type daily

# 只采集龙虎榜
bash scripts/run-collector.sh --type dragon
```

### Windows PowerShell
```powershell
# 初始化数据库
.\scripts\run-collector.ps1 -InitDb

# 采集今日数据
.\scripts\run-collector.ps1

# 采集指定日期
.\scripts\run-collector.ps1 -Date "2024-01-15"
```

### API 接口
- `GET /api/stock/daily` - 查询日K线数据
- `GET /api/dragon-tiger/list` - 查询龙虎榜列表
- `GET /api/dragon-tiger/detail` - 查询龙虎榜明细
- `GET /api/collection/log` - 查询采集日志
