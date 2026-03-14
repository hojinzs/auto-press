import { expect, test } from "@playwright/test";

test.describe("초안 수정 보호", () => {
  test("비인증 사용자는 초안 수정 API 호출 불가", async ({ request }) => {
    const res = await request.patch("/api/content/some-draft-id", {
      data: {
        title: "수정된 제목",
        content_html: "<p>수정된 본문</p>",
      },
    });

    expect(res.status()).toBe(401);
  });

  test("비인증 사용자는 초안 발행 API 호출 불가", async ({ request }) => {
    const res = await request.post("/api/content/some-draft-id/publish", {
      data: {},
    });

    expect(res.status()).toBe(401);
  });

  test("비인증 사용자는 초안 삭제 API 호출 불가", async ({ request }) => {
    const res = await request.delete("/api/content/some-draft-id");

    expect(res.status()).toBe(401);
  });

  test("비인증 사용자는 초안 상세 페이지 접근 시 로그인으로 이동", async ({
    page,
  }) => {
    await page.goto("/drafts/some-draft-id");
    await expect(page).toHaveURL(/\/login/);
  });
});
