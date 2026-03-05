import { test, expect } from "@playwright/test";

test.describe("시맨틱 중복 체크", () => {
  test("비인증 사용자는 초안 생성 페이지 접근 불가", async ({ page }) => {
    await page.goto("/drafts/new");
    await expect(page).toHaveURL(/\/login/);
  });
});
