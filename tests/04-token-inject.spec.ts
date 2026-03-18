import { test, expect } from '@playwright/test';

/**
 * 04-token-inject.spec.ts —— Token / Cookie 手动注入
 *
 * 适用场景：
 *   - 应用使用 JWT Token（存在 Authorization Header）
 *   - 应用通过 API 登录返回 Token，再在页面请求中携带
 *   - 需要模拟 Token 过期、刷新等场景
 *
 * 三种注入方式演示：
 *   ① 直接设置 Cookie（模拟 session-based 认证）
 *   ② 拦截请求并注入 Authorization Header（JWT 场景）
 *   ③ 通过 addInitScript 在页面加载前注入 localStorage Token
 */
test.describe('Token / Cookie 手动注入', () => {

  // ── 方式①：直接注入 Cookie ─────────────────────────────────────
  test('🍪 方式①：手动设置 Cookie 模拟登录状态', async ({ context, page }) => {
    // 在访问页面之前，直接向 context 注入 Cookie
    // 等效于 global-setup.ts 中保存/恢复的 storageState
    await context.addCookies([
      {
        name: 'rack.session',
        // ⚠️ 此处填入真实的 session 值（可从 DevTools > Application > Cookies 中获取）
        value: 'YOUR_SESSION_COOKIE_VALUE_HERE',
        domain: 'the-internet.herokuapp.com',
        path: '/',
        httpOnly: true,
        secure: false,
      },
    ]);

    // 现在访问受保护页面（Cookie 已注入，服务端认为已登录）
    await page.goto('https://the-internet.herokuapp.com/secure');
    // 注：因 Cookie 值是示例，此断言可能失败，演示注入流程为主
    console.log('当前 URL（注入 Cookie 后）:', page.url());
  });

  // ── 方式②：拦截请求注入 JWT Authorization Header ─────────────────
  test('🔑 方式②：拦截 API 请求注入 JWT Token', async ({ page }) => {
    // 先通过 API 获取 Token（模拟 SPA 应用的登录流程）
    const token = await getJwtToken();
    console.log('获取到的 Token:', token.substring(0, 30) + '...');

    // 拦截所有 API 请求，自动附加 Authorization Header
    await page.route('**/api/**', async route => {
      const headers = {
        ...route.request().headers(),
        Authorization: `Bearer ${token}`,
      };
      await route.continue({ headers });
    });

    // 注入后正常访问页面，请求会自动携带 Token
    await page.goto('https://the-internet.herokuapp.com/');
    console.log('请求拦截已配置，Token 将自动注入 API 请求头');
  });

  // ── 方式③：通过 initScript 注入 localStorage Token ───────────────
  test('💾 方式③：在页面加载前注入 localStorage 中的 Token', async ({ page }) => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.demo-payload.signature';

    // addInitScript 在每次页面导航后、页面脚本执行前运行
    // 用于模拟 SPA 应用从 localStorage 中读取 Token 的场景
    await page.addInitScript(token => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_id', '12345');
      localStorage.setItem('user_role', 'admin');
    }, fakeToken);

    await page.goto('https://the-internet.herokuapp.com/');

    // 验证 localStorage 已被成功注入
    const storedToken = await page.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(storedToken).toBe(fakeToken);
    console.log('localStorage 中的 Token:', storedToken);
  });

  // ── 方式④：拦截登录接口，模拟 Token 过期场景 ────────────────────
  test('⏰ 方式④：模拟 Token 过期，验证应用的刷新逻辑', async ({ page }) => {
    let requestCount = 0;

    // 拦截 /secure 路径，首次返回 401（Token 过期），
    // 后续请求正常放行（模拟 Token 刷新成功）
    await page.route('**/secure', async route => {
      requestCount++;
      if (requestCount === 1) {
        // 第一次：模拟 401 Unauthorized
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Token expired' }),
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('⚡ 模拟返回 401 Token 过期');
      } else {
        // 后续请求正常放行（Token 刷新后重试）
        await route.continue();
      }
    });

    await page.goto('https://the-internet.herokuapp.com/secure');
    console.log('请求次数:', requestCount, '| 当前 URL:', page.url());
  });
});

// ─── 工具函数：模拟通过 API 获取 JWT Token ──────────────────────────
async function getJwtToken(): Promise<string> {
  // 真实场景：调用登录 API，如：
  // const response = await fetch('/api/auth/login', {
  //   method: 'POST',
  //   body: JSON.stringify({ username, password })
  // });
  // const { token } = await response.json();
  // return token;

  // 此处返回示例 Token 用于演示
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.signature';
}
