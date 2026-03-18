# 🎭 Playwright Login Demo (登录状态处理完整示例)

![Banner](./playwright_login_demo_banner.png)

这是一个基于 [Playwright](https://playwright.dev/) 的端到端（E2E）测试示例项目，专门展示了在自动化测试中处理 **登录、会话复用、多账号并发以及 Token 注入** 的多种最佳实践。

## 🌟 核心特性

本项目涵盖了 Web 自动化测试中最常见且最具挑战性的登录场景：

- **01. 基础登录 (Basic Login)**: 标准的 UI 登录流程，演示如何处理登录框、错误校验及成功跳转。
- **02. 登录状态复用 (Reuse Auth State)**: 利用 Playwright 的 `storageState` 机制。通过一次 `global-setup` 登录并保存 Cookie/localStorage，在所有后续测试中实现免登录，极大提升执行效率。
- **03. 多用户角色 (Multi-User Roles)**: 演示如何在不同的测试项目或测试用例中灵活切换不同权限（如管理员、普通用户）的账号。
- **04. Token/Cookie 注入 (Token Injection)**: 直接通过接口获取 Token 或绕过繁琐的 UI 登录步骤，直接注入会话状态。

## 🏗️ 项目架构

```text
├── auth/               # 存放自动生成的登录状态文件 (user-state.json)
├── pages/              # 页面对象模型 (Page Object Model)
├── tests/              # 测试脚本目录
│   ├── global-setup.ts # 全局初始配置：执行主账号登录并持久化状态
│   └── 0*.spec.ts      # 各阶段演示用例
├── utils/              # 通用工具类 (如加密、API 请求封装)
├── playwright.config.ts # Playwright 核心配置文件
└── .env                # 环境变量配置
```

## 🚀 快速开始

### 1. 前置要求

- [Node.js](https://nodejs.org/) (v16.0+)
- [pnpm](https://pnpm.io/) (推荐) 或 npm / yarn

### 2. 安装依赖

```bash
# 安装 NPM 包
npm install

# 安装 Playwright 浏览器
npm run install:browsers
```

### 3. 环境配置

将项目根目录下的 `.env.example` 复制并重命名为 `.env`，然后根据实际情况填入测试账号信息：

```bash
cp .env.example .env
```

### 4. 运行测试

```bash
# 运行所有测试
npm test

# 以 UI 模式运行（强烈推荐：方便调试）
npm run test:ui

# 运行特定项目的测试（见 playwright.config.ts 中的 projects）
npx playwright test --project=reuse-auth

# 查看测试报告
npm run test:report
```

## 🛠️ 常用开发命令

- `npm run codegen`: 启动 Playwright 录制器，快速生成登录脚本。
- `npm run test:debug`: 以调试模式启动项目，自动打开浏览器。

## 📝 最佳实践建议

1. **避免重复 UI 登录**: 尽可能使用 `globalSetup` 或 API 登录来初始化测试环境。
2. **账号分层**: 为不同的权限组创建独立的 `storageState`。
3. **数据隔离**: 测试账号应具备幂等性，或在测试结束后清理环境数据。

---