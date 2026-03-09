import { test, expect } from "@playwright/test";

test.describe("초안 수정 API 보호", () => {
  test("비인증 사용자는 초안 수정 API 호출 불가", async ({ request }) => {
    const res = await request.patch("/api/content/some-draft-id", {
      data: {
        title: "수정된 제목",
        content_html: "<p>수정된 본문</p>",
      },
    });

    expect(res.status()).toBe(401);
  });

  test("비인증 사용자는 초안 상세 페이지에서 로그인으로 리다이렉트", async ({
    page,
  }) => {
    await page.goto("/drafts/some-draft-id");
    await expect(page).toHaveURL(/\/login/);
  });
});
