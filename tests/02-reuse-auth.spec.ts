import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard-page';

/**
 * 02-reuse-auth.spec.ts —— 复用已保存的登录状态
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  关键配置（在 playwright.config.ts 中）：               │
 * │                                                         │
 * │  projects: [{                                           │
 * │    name: 'reuse-auth',                                  │
 * │    use: {                                               │
 * │      storageState: './auth/user-state.json' ← 核心     │
 * │    }                                                    │
 * │  }]                                                     │
 * │                                                         │
 * │  Playwright 在测试开始前自动将 JSON 文件中的              │
 * │  Cookie/Storage 注入浏览器，测试代码无需任何登录步骤。   │
 * └─────────────────────────────────────────────────────────┘
 */
test.describe('复用登录状态（无需重新登录）', () => {
  test('📂 直接访问受保护页面（已自动注入登录状态）', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    // ⚡ 不需要任何登录代码！状态由 storageState 自动注入
    await dashboard.goto();

    // 使用 Web-first 断言：自动重试，直到 Logout 按钮出现
    await expect(dashboard.logoutButton).toBeVisible();
    console.log('当前 URL：', page.url());
  });

  test('🍪 验证 Cookie 已被正确注入', async ({ page, context }) => {
    // 获取当前 context 中所有 Cookie
    const cookies = await context.cookies();
    console.log('注入的 Cookies：', JSON.stringify(cookies, null, 2));

    // 断言：存在 session 相关的 Cookie
    const sessionCookie = cookies.find(c => c.name === 'rack.session');
    expect(sessionCookie).toBeDefined();
  });

  test('📦 验证 localStorage / sessionStorage 数据', async ({ page }) => {
    await page.goto('/secure');

    // 读取 localStorage（如果应用使用了 token 存储）
    const localStorageData = await page.evaluate(() =>
      JSON.stringify(localStorage)
    );
    console.log('localStorage 内容：', localStorageData);

    // 读取 sessionStorage
    const sessionStorageData = await page.evaluate(() =>
      JSON.stringify(sessionStorage)
    );
    console.log('sessionStorage 内容：', sessionStorageData);
  });
});
