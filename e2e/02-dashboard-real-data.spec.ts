import { test, expect } from "@playwright/test";

test.describe("대시보드 실제 데이터", () => {
  // 대시보드는 인증 필요 - 비인증 시 로그인으로 리다이렉트됨
  test("비인증 사용자는 대시보드에 접근 불가", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("로그인 페이지 UI 요소가 정상 렌더링됨", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Welcome Back");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.locator('button[type="submit"]'),
    ).toBeVisible();
  });
});
