import { chromium, FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

/**
 * global-setup.ts —— 全局登录状态初始化
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  策略：在所有测试开始前只登录一次，把浏览器的完整状态     │
 * │  （Cookie、localStorage、sessionStorage）序列化为 JSON  │
 * │  文件，后续测试直接加载此文件，跳过登录流程。            │
 * │                                                         │
 * │  优点：                                                  │
 * │   ✅ 节省时间（不重复登录）                              │
 * │   ✅ 降低测试对登录接口的依赖                            │
 * │   ✅ 支持多账号角色并行                                  │
 * └─────────────────────────────────────────────────────────┘
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  // 确保 auth 目录存在
  const authDir = path.join(__dirname, '../auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 使用 Playwright 下载的默认 Chromium 浏览器
  const browser = await chromium.launch();

  // ── 保存普通用户登录状态 ────────────────────────────────────
  await saveLoginState(browser, baseURL!, {
    username: process.env.TEST_USER_NAME!,
    password: process.env.TEST_USER_PASSWORD!,
    outputPath: path.join(authDir, 'user-state.json'),
    role: '普通用户',
  });

  await browser.close();
  console.log('\n✅ global-setup 完成：所有角色登录状态已保存\n');
}

// ── 辅助函数：执行登录并存储状态 ────────────────────────────────
async function saveLoginState(
  browser: import('@playwright/test').Browser,
  baseURL: string,
  opts: { username: string; password: string; outputPath: string; role: string }
) {
  // 每个角色使用独立的 BrowserContext，状态完全隔离
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  console.log(`\n🔐 正在登录 [${opts.role}]: ${opts.username}`);
  await page.goto('/login');
  await page.locator('#username').fill(opts.username);
  await page.locator('#password').fill(opts.password);
  await page.getByRole('button', { name: /login/i }).click();

  // 等待跳转到受保护页面，确认登录成功
  await page.waitForURL('**/secure');
  console.log(`   ↳ 登录成功，URL: ${page.url()}`);

  // 将当前 Context 的全部状态序列化为 JSON 文件
  // 文件内容包含：cookies、origins（localStorage / sessionStorage）
  await context.storageState({ path: opts.outputPath });
  console.log(`   ↳ 状态已保存至: ${opts.outputPath}`);

  await context.close();
}

export default globalSetup;
