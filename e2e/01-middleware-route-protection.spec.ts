import { test, expect } from "@playwright/test";

test.describe("미들웨어 라우트 보호", () => {
  test("비인증 사용자가 보호된 경로 접근 시 /login으로 리다이렉트", async ({
    page,
  }) => {
    // 대시보드 (보호된 경로)
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);

    // 초안 목록 (보호된 경로)
    await page.goto("/drafts");
    await expect(page).toHaveURL(/\/login/);

    // 설정 페이지 (보호된 경로)
    await page.goto("/settings/connections");
    await expect(page).toHaveURL(/\/login/);
  });

  test("공개 경로는 리다이렉트 없이 접근 가능", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("h1")).toContainText("Welcome Back");

    await page.goto("/signup");
    await expect(page).toHaveURL(/\/signup/);

    await page.goto("/forgot-password");
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});
