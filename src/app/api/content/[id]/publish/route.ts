import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  // Fetch the draft
  const { data: draft, error: draftError } = await supabase
    .from("content_drafts")
    .select("*, wp_credentials:credential_id(*)")
    .eq("id", id)
    .single();

  if (draftError || !draft) {
    return NextResponse.json(
      { error: "초안을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (draft.status === "published" || draft.status === "scheduled") {
    return NextResponse.json(
      { error: "이미 발행되었거나 예약된 초안입니다." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const scheduledAt: string | undefined = body.scheduled_at;

  const credential = draft.wp_credentials;
  if (!credential) {
    return NextResponse.json(
      { error: "워드프레스 연동 정보를 찾을 수 없습니다." },
      { status: 400 },
    );
  }

  // Get decrypted password via RPC
  const { data: decrypted } = await supabase.rpc("get_wp_credential", {
    p_credential_id: credential.id,
  });

  const wpPassword = decrypted?.[0]?.app_password ?? credential.app_password;
  const baseUrl = credential.site_url.replace(/\/$/, "");
  const wpAuth = btoa(`${credential.username}:${wpPassword}`);

  // Build WordPress post payload
  const wpPayload: Record<string, unknown> = {
    title: draft.title,
    content: draft.content_html,
    status: scheduledAt ? "future" : "publish",
  };

  if (scheduledAt) {
    wpPayload.date = scheduledAt;
  }

  try {
    const wpRes = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${wpAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(wpPayload),
    });

    if (!wpRes.ok) {
      const wpError = await wpRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            wpError.message || `워드프레스 발행 실패: HTTP ${wpRes.status}`,
        },
        { status: 502 },
      );
    }

    const wpPost = await wpRes.json();

    // Update draft status in database
    const newStatus = scheduledAt ? "scheduled" : "published";
    const updateFields: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (scheduledAt) {
      updateFields.scheduled_at = scheduledAt;
    }

    const { data: updatedDraft, error: updateError } = await supabase
      .from("content_drafts")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      draft: updatedDraft,
      wordpress_post_id: wpPost.id,
      wordpress_url: wpPost.link,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "워드프레스 연결 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
