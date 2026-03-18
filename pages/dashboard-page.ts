import { Page, Locator } from '@playwright/test';

/**
 * DashboardPage —— 登录后的受保护页面
 *
 * 用于验证是否已成功进入认证区域，以及执行登出操作。
 */
export class DashboardPage {
  readonly page: Page;

  readonly logoutButton: Locator;
  readonly welcomeMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logoutButton   = page.getByRole('link', { name: /logout/i });
    this.welcomeMessage = page.locator('.flash.success');
  }

  async goto() {
    await this.page.goto('/secure');
  }

  /** 验证是否处于已登录状态（Logout 按钮可见） */
  async isLoggedIn(): Promise<boolean> {
    return this.logoutButton.isVisible();
  }

  /** 执行登出操作 */
  async logout() {
    await this.logoutButton.click();
  }
}
