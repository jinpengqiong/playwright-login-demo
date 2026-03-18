import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

// 加载 .env 文件中的环境变量
dotenv.config();

export default defineConfig({
  // 测试文件所在目录
  testDir: './tests',

  // 每个测试的超时时间（毫秒）
  timeout: 30_000,

  // 全局 setup：在所有测试开始前执行一次登录并保存状态
  globalSetup: './tests/global-setup.ts',

  // 测试报告格式
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    // 所有测试使用的基础 URL
    baseURL: process.env.BASE_URL || 'https://the-internet.herokuapp.com',

    // 截图策略：仅在测试失败时截图
    screenshot: 'only-on-failure',

    // 视频录制策略：仅在测试失败时录制
    video: 'retain-on-failure',

    // 显示浏览器操作追踪（用于 Debug）
    trace: 'on-first-retry',
  },

  projects: [
    // ─── 项目1：普通登录测试（不复用状态）───────────────────
    {
      name: 'basic-login',
      testMatch: '**/01-basic-login.spec.ts',
      // use: { channel: 'chrome' } // 已注释：改用默认的 Playwright Chromium
      use: {},
    },

    // ─── 项目2：复用已保存的登录状态 ─────────────────────────
    {
      name: 'reuse-auth',
      testMatch: '**/02-reuse-auth.spec.ts',
      use: {
        // 直接加载 global-setup 保存的认证状态（Cookie + localStorage）
        storageState: './auth/user-state.json',
      },
    },

    // ─── 项目3：多用户角色并发测试 ───────────────────────────
    {
      name: 'multi-user',
      testMatch: '**/03-multi-user.spec.ts',
      use: {},
    },

    // ─── 项目4：Token/Cookie 拦截注入 ────────────────────────
    {
      name: 'token-inject',
      testMatch: '**/04-token-inject.spec.ts',
      use: {},
    },
  ],
});
