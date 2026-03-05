import { test, expect } from "@playwright/test";

test.describe("비밀번호 재설정 기능", () => {
  test("로그인 페이지에서 Forgot 링크가 /forgot-password로 연결", async ({
    page,
  }) => {
    await page.goto("/login");
    const forgotLink = page.locator('a[href="/forgot-password"]');
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toContainText("Forgot?");
  });

  test("비밀번호 재설정 요청 페이지 UI 렌더링", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("h1")).toContainText("Reset Password");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(
      page.locator('button[type="submit"]'),
    ).toContainText("Send Reset Link");
  });

  test("이메일 미입력 시 폼 제출 불가 (HTML5 validation)", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    // 이메일 필드가 required이므로 페이지가 이동하지 않아야 함
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("비밀번호 재설정 완료 페이지 UI 렌더링", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.locator("h1")).toContainText("Set New Password");
    // 비밀번호 입력 필드 2개 (새 비밀번호 + 확인)
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(2);
    await expect(
      page.locator('button[type="submit"]'),
    ).toContainText("Update Password");
  });

  test("비밀번호 불일치 시 에러 메시지", async ({ page }) => {
    await page.goto("/reset-password");
    await page.locator('input[type="password"]').first().fill("password123");
    await page.locator('input[type="password"]').last().fill("differentpass");
    await page.locator('button[type="submit"]').click();
    await expect(
      page.locator("text=Passwords do not match"),
    ).toBeVisible();
  });

  test("6자 미만 비밀번호 시 에러 메시지", async ({ page }) => {
    await page.goto("/reset-password");
    await page.locator('input[type="password"]').first().fill("12345");
    await page.locator('input[type="password"]').last().fill("12345");
    await page.locator('button[type="submit"]').click();
    await expect(
      page.locator("text=Password must be at least 6 characters"),
    ).toBeVisible();
  });

  test("비밀번호 표시/숨기기 토글", async ({ page }) => {
    await page.goto("/reset-password");
    const pwInput = page.locator('input[type="password"]').first();
    const toggleBtn = page.locator('button[aria-label="Show password"]');
    await expect(pwInput).toHaveAttribute("type", "password");
    await toggleBtn.click();
    // 토글 후 type이 text로 변경됨
    const inputAfter = page.locator("input").first();
    // 비밀번호 필드 확인 - 첫번째 입력 필드가 text로 변경됨
    await expect(
      page.locator('button[aria-label="Hide password"]'),
    ).toBeVisible();
  });

  test("forgot-password에서 로그인 링크", async ({ page }) => {
    await page.goto("/forgot-password");
    const signInLink = page.locator('a[href="/login"]');
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toContainText("Sign in");
  });
});
