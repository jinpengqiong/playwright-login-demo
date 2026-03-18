import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { DashboardPage } from '../pages/dashboard-page';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * 01-basic-login.spec.ts —— 基础登录流程测试
 *
 * 覆盖场景：
 *   ① 正确凭据登录 → 跳转到受保护页
 *   ② 错误密码登录 → 显示错误提示
 *   ③ 登录后退出    → 跳转回登录页
 *
 * 特点：每个 test 都会独立执行登录，不复用状态。
 *       适合测试登录流程本身的正确性。
 */
test.describe('基础登录流程', () => {
  test('✅ 正确凭据 → 成功进入受保护页面', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    // 1. 打开登录页
    await loginPage.goto();

    // 2. 执行登录
    await loginPage.login(
      process.env.TEST_USER_NAME!,
      process.env.TEST_USER_PASSWORD!
    );

    // 3. 断言：URL 已跳转到 /secure
    await expect(page).toHaveURL(/\/secure/);

    // 4. 断言：Logout 按钮可见（说明已处于登录状态）
    expect(await dashboard.isLoggedIn()).toBeTruthy();
  });

  test('❌ 错误密码 → 显示错误提示信息', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('tomsmith', 'wrong-password');

    // 断言：页面显示错误消息
    const errorText = await loginPage.getErrorText();
    expect(errorText).toContain('Your password is invalid!');
  });

  test('🚪 登录后点击 Logout → 返回登录页', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    // 先登录
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USER_NAME!,
      process.env.TEST_USER_PASSWORD!
    );
    await expect(page).toHaveURL(/\/secure/);

    // 再登出
    await dashboard.logout();

    // 断言：跳转回了登录页
    await expect(page).toHaveURL(/\/login/);
  });

  test('🔒 未登录直接访问受保护页 → 被重定向', async ({ page }) => {
    // 直接访问 /secure，不携带任何登录状态
    await page.goto('/secure');

    // 断言：被重定向到登录页
    await expect(page).toHaveURL(/\/login/);
  });
});
