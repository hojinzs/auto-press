import { test, expect } from "@playwright/test";

test.describe("예약 발행 기능", () => {
  test("비인증 사용자는 초안 상세 페이지 접근 불가", async ({ page }) => {
    await page.goto("/drafts/some-draft-id");
    await expect(page).toHaveURL(/\/login/);
  });
});
