import { expect, test } from "@playwright/test";

test.describe("브랜드 보이스 수정", () => {
  test("비인증 사용자는 보이스 프로파일 페이지 접근 불가", async ({ page }) => {
    await page.goto("/voice-profile");
    await expect(page).toHaveURL(/\/login/);
  });

  test("비인증 사용자는 프로파일 수정 API 호출 불가", async ({ request }) => {
    const response = await request.patch("/api/profiling/profile", {
      data: {
        credential_id: "00000000-0000-0000-0000-000000000000",
        profile_data: {},
      },
    });

    expect(response.status()).toBe(401);
  });
});
