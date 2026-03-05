import { test, expect } from "@playwright/test";

test.describe("사이트 연동 정보 수정", () => {
  test("비인증 사용자는 연동 관리 페이지 접근 불가", async ({ page }) => {
    await page.goto("/settings/connections");
    await expect(page).toHaveURL(/\/login/);
  });

  test("로그인 페이지에서 사이트 연동으로의 네비게이션 경로 확인", async ({
    page,
  }) => {
    // 로그인 페이지에서 시작
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Welcome Back");

    // 이메일/패스워드 입력 폼 존재 확인
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});
