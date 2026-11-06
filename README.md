# 产学研项目全流程管理系统

> 一个面向高校科研团队与教师工作室的项目管理平台，把产学研合作项目从**合同签订到结题归档**的全过程搬到线上，实现流程标准化、进度自动计算、操作全程留痕、权限分级管理。

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-6-0170FE?logo=antdesign&logoColor=white)](https://ant.design/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth%20%2B%20Storage-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#许可证)

---

## 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [业务流程](#业务流程)
- [技术栈](#技术栈)
- [系统架构](#系统架构)
- [目录结构](#目录结构)
- [快速开始](#快速开始)
- [数据库初始化](#数据库初始化)
- [部署到 Netlify](#部署到-netlify)
- [核心逻辑说明](#核心逻辑说明)
- [开发历程](#开发历程)
- [常见问题](#常见问题)
- [已知局限](#已知局限)
- [许可证](#许可证)

---

## 项目简介

产学研合作项目的推进通常跨越多个环节：合同审核、合同确认、合同回执、盖章、寄出、客户打款、经费认领、开票、经费报销、结题。参与人多、周期长、材料杂，靠 Excel 加微信群口头同步，很容易出现"谁做到哪一步不透明""材料散落找不到""提交后的数据被随手改动却无人知晓"的问题。

本项目把这条链路完整搬到线上：

- **流程标准化**：6 大环节、10 个业务节点固化到系统里，按顺序推进，不会漏项
- **进度自动计算**：不需要人工打勾，系统按各环节的提交状态自动推导完成度、当前阶段与项目终态
- **变更留痕**：已提交的记录自动锁定，若要修改必须提交申请，管理员审批通过后才解锁，全过程有记录
- **权限分级**：管理员与普通用户两套视图，删除、审批、成员管理等操作仅管理员可用
- **零服务器成本**：纯静态前端 + BaaS 后端，部署在 Netlify 免费额度内

**在线体验：** `https://<你的-netlify-域名>.netlify.app`（首次进入请先注册，系统第一个注册的用户自动成为管理员）

---

## 功能特性

### 用户端

| 模块 | 能力 |
| --- | --- |
| **首页仪表盘** | 进行中 / 已完成项目数、我的待办统计；按状态筛选项目；系统公告列表，**点击标题弹出详情** |
| **项目总览** | 关键词搜索（名称 / 编号 / 企业三字段模糊匹配）、按状态与阶段筛选、分页；新建项目（编号全局唯一校验）；对已提交记录**申请修改** |
| **项目详情** | 项目信息卡 + 整体进度条 + **六步进度条** + 六个业务 Tab，每个 Tab 内可再分子模块 |
| **审批中心** | 查看自己提交的修改申请状态（待审批 / 已通过 / 已驳回）及审批意见 |
| **个人设置** | 修改基础信息（用户名、姓名、电话、邮箱）、修改登录密码、查看我的申请 |

**六大业务环节与子模块：**

| 环节 | 子模块 | 主要录入内容 |
| --- | --- | --- |
| 合同管理 | 合同审核 | 责任人、审核时间、起草方（我方/对方）、合同文件、审核意见 |
| | 合同确认 | 责任人、确认时间、定稿合同、确认说明 |
| | 合同回执 | 责任人、签收时间、快递单号、签收截图 |
| 合同盖章 | 合同盖章 | 盖章时间、合同份数、是否扫描、扫描件、是否上传系统 |
| 合同寄出 | 合同寄出 | 寄出时间、快递公司、单号、客户是否签收、签收凭证、聊天截图 |
| 打款开票 | 客户打款 | 金额、到账时间、银行回单、备注 |
| | 经费认领 | 认领金额、认领时间、说明 |
| | 开票 | 发票类型（增值税专票/普票/电子票/收据）、预览发送/客户确认/正式开具/寄出四个时间节点、发票文件 |
| 经费报销 | 经费报销 | 金额、报销日期、票据、备注 |
| 结题 | 结题 | 结题时间、研究报告、验收报告、结题说明 |

每个子模块都有两个动作：**暂存**（存为草稿，可反复修改）与**提交**（锁定表单，需审批才能再改）。

### 管理端

| 模块 | 能力 |
| --- | --- |
| **成员管理** | 新增成员、编辑资料、调整角色（普通成员 / 管理员）、修改邮箱、启用禁用 |
| **审批中心** | 按状态筛选修改申请，**通过**（可填意见）或**驳回**（必须填理由） |
| **消息通知** | 问题反馈的回复与标记已处理；**公告的发布与删除** |
| **系统配置** | 系统参数键值对编辑、操作日志查看与导出 |

### 通用能力

- **文件云存储**：统一上传组件，文件存 Supabase Storage，返回公开 URL，支持预览与删除
- **路由守卫**：未登录自动跳登录页，非管理员访问后台自动拦截
- **操作留痕**：关键动作写入操作日志（谁、哪个模块、做了什么、所属项目）
- **明暗主题切换**
- **响应式布局**：侧边栏可折叠，PC 与平板浏览器均可使用

---

## 业务流程

```
新建项目（编号唯一）
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  环节 1  合同管理   → 合同审核 / 合同确认 / 合同回执          │
│  环节 2  合同盖章                                            │
│  环节 3  合同寄出                                            │
│  环节 4  打款开票   → 客户打款 / 经费认领 / 开票              │
│  环节 5  经费报销                                            │
│  环节 6  结题                                                │
└─────────────────────────────────────────────────────────────┘
      │
      │  每个环节的所有子模块都已「提交」→ 该环节才算完成
      │  6 个环节全部完成 → 项目状态自动置为「已完成」
      ▼
项目归档
```

**修改审批闭环：**

```
已提交记录被锁定
      │
      ▼
用户提交修改申请（目标模块 + 原因）
      │
      ▼
管理员审批 ──┬── 通过 → 该记录状态回退为 draft，表单自动解锁
            └── 驳回 → 记录不变，写入驳回理由
      │
      ▼
用户编辑后重新提交
```

---

## 技术栈

### 前端

| 技术 | 版本 | 作用 |
| --- | --- | --- |
| React | 19.2 | 组件化 UI |
| TypeScript | 5.9 | 类型约束，保证数据结构不被写歪 |
| Ant Design | 6.5 | 企业级 UI 组件（表格、表单、步骤条、弹窗等） |
| React Router | 7.18 | SPA 路由与路由守卫 |
| React Context | - | 登录态、主题等全局状态 |
| Day.js | 1.11 | 日期格式化与处理 |
| Vite | 5.0 | 开发服务器与生产打包 |

### 后端 / 数据

| 技术 | 作用 |
| --- | --- |
| Supabase PostgreSQL | 关系型数据库，19 张表，含外键级联、CHECK 约束、触发器、索引 |
| Supabase Auth | 邮箱 + 密码认证，JWT 会话管理 |
| Supabase Storage | 对象存储，`uploads` 公共桶存放合同、截图、发票等附件 |
| @supabase/supabase-js | 浏览器端 SDK，直接操作数据库与存储 |

### 工程与部署

| 技术 | 作用 |
| --- | --- |
| Git / GitHub | 版本控制，29 次提交记录 |
| Netlify | 静态托管 + HTTPS + CDN，连接 GitHub 自动构建部署 |
| ESLint / TS Config | 代码规范与类型检查 |

### 语言构成

| 语言 | 大致占比 | 说明 |
| --- | --- | --- |
| TypeScript / TSX | 前端全部源码，27 个文件约 5300 行 | 业务主体 |
| SQL | 约 600 行 | 建表、索引、RLS 策略、触发器 |
| CSS | 少量 | 主要视觉由 Ant Design 提供 |
| JavaScript | 配置文件 | Vite 等构建配置 |

---

## 系统架构

```
┌──────────────────────────────────────────────────────────────┐
│                     浏览器（PC / 平板）                        │
│   React 19 SPA  +  Ant Design 6  +  React Router 7           │
│                                                              │
│   pages/ ── 页面        components/ ── 通用组件                │
│   contexts/ ── 全局状态  types/ ── 类型定义                    │
│                        │                                     │
│                        ▼                                     │
│   services/supabaseApi.ts   统一数据访问层（适配器）            │
│   services/supabaseClient.ts Supabase 客户端                   │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS（anon key + 用户会话 JWT）
┌────────────────────────▼─────────────────────────────────────┐
│                       Supabase（云服务）                       │
│   ┌───────────┐   ┌────────────┐   ┌────────────────────┐    │
│   │ Auth 认证  │   │ PostgreSQL │   │ Storage 对象存储    │    │
│   │ 邮箱+密码  │   │  19 张表    │   │ uploads 公共桶      │    │
│   └───────────┘   └────────────┘   └────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                         ▲
                         │ git push → 自动构建
┌────────────────────────┴─────────────────────────────────────┐
│        GitHub 仓库（源码）  →  Netlify（HTTPS + CDN）           │
└──────────────────────────────────────────────────────────────┘
```

### 为什么是"纯前端 + BaaS"

传统方案需要自建 Node 服务、购买服务器、配置数据库与备份。改用 Supabase 后，数据库、认证、对象存储三项能力以 SDK 形式直接提供，前端可以通过 `supabase.from('表名').select()` 完成查询，**省掉整个后端服务层**，部署简化为静态托管。这也是本项目能在零服务器成本下支持团队异地协同的原因。

### 数据访问适配层

业务代码中统一使用 `api.get('/projects')` 这类 REST 风格调用。`services/supabaseApi.ts` 对外暴露与 axios 完全一致的 `get / post / put / delete` 签名与返回结构（`{ data: { success, data } }`），内部通过 URL 路由匹配到对应的 Supabase 表操作。

这样做的收益是：数据源从自建 Express + SQLite 迁移到 Supabase 时，改动面收敛到这一个文件，**所有业务页面零改动**即可完成切换。

---

## 目录结构

```
.
├── industry-academia-research/          # 主程序目录
│   ├── index.html                       # HTML 入口
│   ├── package.json                     # 依赖与脚本
│   ├── vite.config.ts                   # Vite 配置
│   ├── tsconfig.json                    # TypeScript 配置
│   ├── public/_redirects                # Netlify SPA 路由回退规则
│   ├── dist/                            # 构建产物（部署目标，git 忽略）
│   ├── src/                             # 前端源码
│   │   ├── main.tsx                     # 应用入口
│   │   ├── App.tsx                      # 路由表与路由守卫
│   │   ├── index.css                    # 全局样式
│   │   ├── services/                    # 数据访问层
│   │   │   ├── supabaseClient.ts        #   Supabase 客户端初始化
│   │   │   ├── supabaseApi.ts           #   统一数据访问适配层
│   │   │   └── api.ts                   #   早期 axios 实例（兼容保留）
│   │   ├── contexts/                    # 全局状态
│   │   │   ├── AuthContext.tsx          #   登录态管理
│   │   │   └── ThemeContext.tsx         #   明暗主题
│   │   ├── layouts/                     # 页面骨架
│   │   │   ├── FrontLayout.tsx          #   用户端布局
│   │   │   └── AdminLayout.tsx          #   管理端布局
│   │   ├── pages/                       # 页面
│   │   │   ├── Login.tsx                #   登录 / 注册
│   │   │   ├── dashboard/Dashboard.tsx  #   首页仪表盘
│   │   │   ├── projects/                #   项目总览 / 项目详情
│   │   │   ├── modules/                 #   六大业务环节表单
│   │   │   ├── admin/                   #   管理端四个页面
│   │   │   └── settings/Settings.tsx    #   个人设置
│   │   ├── components/FileUpload.tsx    # 文件上传组件
│   │   └── types/index.ts               # 类型定义
│   └── server/                          # 第一版后端（Express + SQLite，已停用，源码保留）
│       ├── server.ts
│       ├── db/                          #   SQLite 连接与建表
│       ├── routes/                      #   业务路由
│       ├── middleware/                  #   鉴权中间件
│       └── utils/                       #   上传与日志工具
│
├── supabase-init.sql                    # 数据库初始化脚本（19 张表 + 索引 + 触发器 + RLS）
├── add-current-stage.sql                # 补充 current_stage 字段
├── auto-sync-email-trigger.sql          # 邮箱自动同步触发器
├── disable-rls.sql                      # 关闭行级安全策略（排障用）
├── fix-rls.sql                          # RLS 策略修复
├── fix-all-rls-final.sql                # 全表 RLS 终极修复
├── fix-profiles-rls.sql                 # profiles 表权限修复
├── fix-notifications-rls.sql            # 通知表权限修复
├── fix-auth-confirm.sql                 # 手动确认邮箱
├── update-auth-email.sql                # 手动修改登录邮箱
├── final-fix.sql                        # 项目状态不更新问题修复
├── fix_antd6.py                         # Ant Design 6 批量适配脚本（工具，非业务代码）
└── .gitignore
```

> 根目录的 `.sql` 文件是**部署与排障脚本**，并非业务代码。它们记录了一次次线上问题是如何被定位与修复的，详见 [开发历程](#开发历程)。

---

## 快速开始

### 环境要求

- Node.js 18 及以上（开发时使用 v24）
- npm 9 及以上
- 一个 Supabase 项目（免费额度即可）

### 1. 克隆仓库

```bash
git clone https://github.com/Annbertie/-.git industry-academia-research
cd industry-academia-research/industry-academia-research
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在 `industry-academia-research/` 目录下新建 `.env.local`：

```bash
VITE_SUPABASE_URL=https://<你的项目ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<你的 anon public key>
```

两个值可在 Supabase 控制台的 **Project Settings → API** 中获取。

> `anon key` 是设计上可公开的浏览器端密钥，权限由数据库的 RLS 策略约束。即便如此，也建议通过环境变量注入，不要把密钥硬编码进源码提交。

### 4. 启动开发服务器

```bash
npm run dev
```

浏览器访问 `http://localhost:5173`。

### 5. 首次使用

打开登录页 → 点击"没有账号？去注册" → 填写用户名、邮箱、密码。

**系统第一个注册的用户会自动成为管理员**（通过统计 `profiles` 表记录数判断）。之后注册的用户默认为普通成员，可在管理端"成员管理"中调整角色。

> 如果注册后登录提示邮箱未验证，请在 Supabase 控制台 **Authentication → Providers → Email** 中关闭 **Confirm email**。

### 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器（端口 5173） |
| `npm run build` | 构建生产包到 `dist/` |
| `npm run preview` | 本地预览构建产物 |

> **注意：** 当前线上版本为纯前端架构，不需要启动 `server/` 目录下的后端。`server/` 是第一版本地单体架构的源码，仅作历史记录保留。

---

## 数据库初始化

在 Supabase 控制台的 **SQL Editor** 中，按顺序执行以下步骤。

### 步骤 1：创建表结构

复制并执行 [`supabase-init.sql`](./supabase-init.sql)。脚本会创建：

- **19 张表**：用户体系 2 张、项目主体 2 张、六大环节业务表 10 张、流程控制 1 张、支撑能力 5 张（含旧版 `feedbacks` 表的兼容字段）
- **3 个触发器**：新用户注册自动建档、邮箱变更自动同步、更新时间自动维护
- **16 个索引**：优化列表查询与进度计算的性能
- **RLS 策略**：初始版本的权限规则

执行后有 6 张业务表需要补充 `current_stage` 与时间字段，继续执行 [`add-current-stage.sql`](./add-current-stage.sql)。

### 步骤 2：创建存储桶

**Storage → New bucket**：

- 名称：`uploads`
- Public bucket：**开启**（文件需要能通过 URL 直接预览/下载）

### 步骤 3：关闭邮箱验证

**Authentication → Providers → Email** → 关闭 **Confirm email**。

原因：系统面向内部团队使用，成员账号由管理员创建，不走邮箱验证流程。

### 步骤 4：（可选）配置邮箱同步触发器

如果不配置，会出现"在成员管理里改了邮箱，但登录仍然只认旧邮箱"的问题——因为系统里存在两处邮箱：`profiles.email`（业务表）与 `auth.users.email`（认证源）。

执行 [`auto-sync-email-trigger.sql`](./auto-sync-email-trigger.sql) 即可让前者变更时自动同步到后者。

### 脚本清单说明

| 脚本 | 用途 | 是否必执行 |
| --- | --- | --- |
| `supabase-init.sql` | 建表 + 索引 + 触发器 + RLS | 必执行 |
| `add-current-stage.sql` | 补充 `current_stage` 字段 | 必执行 |
| `auto-sync-email-trigger.sql` | 邮箱自动同步 | 建议执行 |
| `disable-rls.sql` | 关闭全部表的 RLS | 排障用 |
| `fix-rls.sql` / `fix-all-rls-final.sql` / `fix-profiles-rls.sql` / `fix-notifications-rls.sql` | RLS 策略修复 | 排障用 |
| `fix-auth-confirm.sql` | 手动确认某个账号的邮箱 | 排障用 |
| `update-auth-email.sql` | 手动修改某个账号的登录邮箱 | 排障用 |
| `final-fix.sql` | 修复项目状态不更新 | 排障用 |

---

## 部署到 Netlify

本项目使用 Netlify 连接 GitHub 仓库实现自动部署，`main` 分支每次提交都会触发重新构建。

### 配置项

| 配置 | 值 |
| --- | --- |
| Branch to deploy | `main` |
| Base directory | `industry-academia-research` |
| Build command | `npm run build` |
| Publish directory | `industry-academia-research/dist` |

### 环境变量

在 **Site configuration → Environment variables** 中添加：

| Key | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<项目ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `<anon public key>` |

### SPA 路由回退

`public/_redirects` 中的内容如下，用于保证刷新 `/projects/xxx` 这类深层路由不会 404：

```
/*    /index.html   200
```

### 更新流程

```bash
git add <files>
git commit -m "feat: xxx"
git push origin main
```

推送后 Netlify 会自动构建部署，约 1～2 分钟生效。已经打开页面的用户刷新（Ctrl + F5）即可看到新版本。

---

## 核心逻辑说明

### 项目进度自动计算

实现在 [`src/services/supabaseApi.ts`](./industry-academia-research/src/services/supabaseApi.ts) 的 `calcProjectProgress()` 与 `syncProjectStatus()`。

**环节与表的映射关系：**

```
环节 1 合同管理 = contract_reviews + contract_confirmations + contract_receipts
环节 2 合同盖章 = contract_stamps
环节 3 合同寄出 = contract_shipments
环节 4 打款开票 = payments + fund_claims + invoices
环节 5 经费报销 = reimbursement_records
环节 6 结题     = project_closures
```

**计算规则：**

1. 对每个环节，并发查询其所有表中 `project_id = 当前项目` 且 `status = 'submitted'` 的记录条数
2. 该环节的所有表都有提交记录，这个环节才算完成（不是只看有没有记录，必须全部提交）
3. `整体进度 = 已完成环节数 / 6 × 100%`
4. **只有整体进度为 100%，项目状态才置为 `completed`**，否则保持 `active`
5. 同时把「第一个未完成的环节」写入 `projects.current_stage`，作为当前阶段

**两个关键细节：**

- 统计必须严格带上 `status = 'submitted'` 条件，否则创建项目时预置的空草稿会被误判为已完成
- 创建项目时会为 10 张业务表各预置一条 `draft` 空记录，保证后续操作永远是「更新」而不是「新增」，计算口径稳定

每次任意子模块提交成功后，都会调用 `syncProjectStatus()` 重新计算并回写项目状态，因此新建项目无需任何手工操作数据库的步骤。

### 修改申请审批

审批通过后会把原记录的状态由 `submitted` 改回 `draft`，从而解锁表单；驳回则记录不变并写入驳回理由。**审批是唯一能把已锁定记录解锁的通道**，保证提交后的数据不会被随意篡改。

### 文件名安全化

Supabase Storage 的 key 不接受空格与部分特殊字符，否则上传会直接报 `Invalid key`。上传前统一处理：

```ts
const safeName = file.name.replace(/\s+/g, '_').replace(/[^\w.\-]/g, '');
const fileName = `${Date.now()}_${safeName}`;
```

---

## 开发历程

项目共 **29 次提交**，可以清晰地分为四个阶段。

### 阶段一：本地单体版本

技术栈为 React + Vite + TypeScript + Ant Design，后端使用 Express + better-sqlite3，Multer 处理上传，PM2 守护进程，监听 `0.0.0.0:5000`，局域网内可通过 `http://IP:5000` 访问。

局限：数据全在本机，电脑关机或换网络（团队成员居家办公 WiFi 不同）就无法使用。

### 阶段二：架构迁移到云端

- 编写 19 张表的数据库初始化脚本
- 前端直连 Supabase，移除对本地后端的依赖
- 登录页增加注册功能，首个注册用户自动成为管理员
- 打通 GitHub → Netlify 自动部署链路

### 阶段三：线上问题攻坚

这一阶段几乎每个提交都对应一个真实线上问题：

| 问题现象 | 根因 | 解决方案 |
| --- | --- | --- |
| 注册后无法登录 | Supabase 默认要求邮箱验证 | 关闭 Email Confirmation + 提供手动确认 SQL |
| 接口全部 404 | 迁移时部分页面仍引用旧的 axios 地址 | 批量替换所有页面的 API 引入 |
| 文件上传报 `Invalid key` | 文件名含空格与特殊字符 | 上传前做文件名安全化处理 |
| 项目状态无法更新 | RLS 行级安全策略拦截写操作 | 编写多版 RLS 修复脚本，最终由应用层控制权限 |
| 查询报 `column current_stage does not exist` | 建表脚本缺字段 | 补充字段并回填初始值 |
| 所有模块提交完仍显示"进行中" | 进度计算口径错误 + 空草稿记录干扰 | 严格按 `status='submitted'` 统计 + 建项目时预置草稿记录 |
| 首页统计显示 0 个项目 | 分页默认 10 条导致统计被截断 | 首页单独拉全量项目用于统计 |
| 后台公告管理白屏 | 接口返回 `{list: []}` 而前端按数组渲染 | 统一数据格式解析，兼容两种结构 |
| 新增成员无法用其邮箱登录 | `profiles.email` 与 `auth.users.email` 不一致 | 触发器自动同步，用 `SECURITY DEFINER` 提权执行 |
| 修改邮箱后仍需用旧邮箱登录 | 同上 | 触发器内同步更新 `auth.users` 并置 `email_confirmed_at` |

### 阶段四：功能补全

- 管理员删除项目（依赖外键 `ON DELETE CASCADE` 级联清理）
- 首页公告支持点击查看详情
- 管理员删除公告（带二次确认）

---

## 常见问题

**Q：注册后登录提示"Email not confirmed"？**
在 Supabase 控制台 **Authentication → Providers → Email** 关闭 **Confirm email**；或执行 `fix-auth-confirm.sql` 手动确认该账号。

**Q：新增成员后，用他的邮箱登录不了？**
系统里有两处邮箱：`profiles.email`（业务表）与 `auth.users.email`（认证源）。需要通过 Supabase Auth 创建该成员账号，并保证两处邮箱一致。建议执行 `auto-sync-email-trigger.sql` 让二者自动同步。

**Q：改了邮箱，但登录还是只能用旧邮箱？**
同上，执行 `auto-sync-email-trigger.sql`。

**Q：所有模块都提交了，项目还是显示"进行中"？**
检查每个环节下的**所有子模块**是否都已提交（合同管理有 3 个、打款开票有 3 个）。任一子模块未提交，该环节就不算完成。

**Q：刷新深层页面（如 `/projects/123`）出现 404？**
确认 `public/_redirects` 存在且内容为 `/*    /index.html   200`，并在 Netlify 上重新部署。

**Q：文件上传失败，报 `Invalid key`？**
文件名包含空格或特殊字符。当前代码已做安全化处理，若仍报错请检查是否有其他上传入口未走统一组件。

**Q：为什么仓库里还有 `server/` 目录？**
那是第一版本地单体架构的后端源码，当前线上版本已不再使用，仅作架构演进的记录保留。

---

## 已知局限

如实记录，也是后续可优化的方向：

1. **安全模型是折中方案**：为了稳定性，当前放开了数据库 RLS，权限判断前移到应用层（路由守卫 + 角色判断）。这是面向内部小团队的合理取舍，但不是生产级方案。若要对真实业务开放，应重写 RLS 做项目级成员隔离，并用 Edge Function 承担服务端鉴权。
2. **部分业务逻辑在前端**：进度计算位于前端数据访问层，理想做法是下沉为数据库视图或函数，让逻辑单一来源、多端复用。
3. **缺少自动化测试**：目前依赖人工回归，每次改动都需要手工走一遍六个环节，效率偏低。计划用 Vitest 覆盖进度计算、用 Playwright 覆盖端到端主流程。
4. **无服务端校验**：所有校验都在前端完成，绕过前端即可直接写库。

---

## 许可证

本项目基于 MIT License 开源，可自由用于学习与二次开发。

---

## 技术关键词

`React` `TypeScript` `Ant Design` `Vite` `React Router` `SPA` `BaaS` `Supabase` `PostgreSQL` `SQL` `数据库设计` `触发器` `外键级联` `RBAC 权限控制` `JWT 认证` `对象存储` `Git` `CI/CD` `Netlify` `前后端分离` `组件化`
