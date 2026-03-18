import { Page, Locator } from '@playwright/test';

/**
 * LoginPage —— 登录页面的 Page Object Model (POM)
 *
 * POM 思想：将页面的元素定位和操作封装为类方法，
 * 测试代码只调用业务方法，不关心选择器细节，易于维护。
 */
export class LoginPage {
  readonly page: Page;

  // ── 页面元素定位器 ──────────────────────────────────────────
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput  = page.locator('#username');
    this.passwordInput  = page.locator('#password');
    this.submitButton   = page.getByRole('button', { name: /login/i });
    this.errorMessage   = page.locator('.flash.error');
    this.successMessage = page.locator('.flash.success');
  }

  // ── 导航 ────────────────────────────────────────────────────
  async goto() {
    await this.page.goto('/login');
  }

  // ── 核心操作：填写表单并提交 ─────────────────────────────────
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  // ── 断言辅助：等待并返回错误提示文本 ────────────────────────
  async getErrorText(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible' });
    return (await this.errorMessage.textContent()) ?? '';
  }
}
