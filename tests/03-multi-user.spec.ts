import { test, expect, Browser, BrowserContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 03-multi-user.spec.ts —— 多角色/多用户并发场景
 *
 * 场景：同时模拟多个用户操作（如：管理员审批 + 普通用户提交）
 *
 * 核心思路：
 *   ① 为每个角色创建独立的 BrowserContext（互不干扰）
 *   ② 每个 Context 保存各自的登录状态文件
 *   ③ 测试中按需加载对应角色的状态
 */

// ─── 测试夹具：创建多个用户上下文 ─────────────────────────────────
const multiUserTest = test.extend<{
  userAContext: BrowserContext;
  userBContext: BrowserContext;
}>({
  // 夹具 userAContext：用于用户A（独立浏览器上下文）
  userAContext: async ({ browser }, use) => {
    const context = await loginAndGetContext(browser, {
      username: process.env.TEST_USER_NAME || 'tomsmith',
      password: process.env.TEST_USER_PASSWORD || 'SuperSecretPassword!',
      statePath: './auth/user-a-state.json',
    });
    await use(context);
    await context.close();
  },

  // 夹具 userBContext：用于用户B（完全独立的 Cookie/存储）
  userBContext: async ({ browser }, use) => {
    // 演示目的：用户B使用同一账号但独立 Context，
    // 真实项目中可配置不同账号
    const context = await loginAndGetContext(browser, {
      username: process.env.TEST_USER_NAME || 'tomsmith',
      password: process.env.TEST_USER_PASSWORD || 'SuperSecretPassword!',
      statePath: './auth/user-b-state.json',
    });
    await use(context);
    await context.close();
  },
});

// ─── 测试用例 ──────────────────────────────────────────────────────
multiUserTest.describe('多用户并发场景', () => {
  multiUserTest(
    '👥 两个用户同时操作（互不干扰）',
    async ({ userAContext, userBContext }) => {
      // 用户A 打开受保护页面
      const pageA = await userAContext.newPage();
      await pageA.goto('https://the-internet.herokuapp.com/secure');

      // 用户B 同时打开受保护页面（完全独立的 Session）
      const pageB = await userBContext.newPage();
      await pageB.goto('https://the-internet.herokuapp.com/secure');

      // 两者都应处于登录状态
      expect(await pageA.locator('a[href="/logout"]').isVisible()).toBeTruthy();
      expect(await pageB.locator('a[href="/logout"]').isVisible()).toBeTruthy();

      console.log('用户A URL:', pageA.url());
      console.log('用户B URL:', pageB.url());

      // 用户A 退出，不影响用户B
      await pageA.locator('a[href="/logout"]').click();
      await expect(pageA).toHaveURL(/\/login/);

      // 用户B 仍然在线
      expect(await pageB.locator('a[href="/logout"]').isVisible()).toBeTruthy();
    }
  );
});

// ─── 辅助函数：登录并返回已认证的 Context ─────────────────────────
async function loginAndGetContext(
  browser: import('@playwright/test').Browser,
  opts: { username: string; password: string; statePath: string }
): Promise<BrowserContext> {
  const authDir = path.dirname(opts.statePath);
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  // 注：此处的 browser 实例已由 Playwright 测试框架通过 channel:'chrome' 配置创建
  const context = await browser.newContext({
    baseURL: 'https://the-internet.herokuapp.com',
  });
  const page = await context.newPage();

  await page.goto('/login');
  await page.locator('#username').fill(opts.username);
  await page.locator('#password').fill(opts.password);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL('**/secure');

  // 保存状态到文件（后续可直接加载，避免重复登录）
  await context.storageState({ path: opts.statePath });
  return context;
}
