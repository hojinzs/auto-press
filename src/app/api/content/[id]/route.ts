import { NextRequest, NextResponse } from "next/server";
import { hasMeaningfulDraftHtml, normalizeDraftHtml } from "@/lib/draft-content";
import type { DraftStatus } from "@/types/content";
import { createClient } from "@/utils/supabase/server";

const BLOCKED_EDIT_STATUSES: DraftStatus[] = [
  "published",
  "scheduled",
  "archived",
];
const ALLOWED_PATCH_STATUSES: DraftStatus[] = ["draft"];

export async function GET(
  _request: NextRequest,
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

  const { data, error } = await supabase
    .from("content_drafts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
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

  const { data: currentDraft, error: currentDraftError } = await supabase
    .from("content_drafts")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (currentDraftError || !currentDraft) {
    return NextResponse.json(
      { error: "초안을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (BLOCKED_EDIT_STATUSES.includes(currentDraft.status as DraftStatus)) {
    return NextResponse.json(
      { error: "발행/예약/보관된 초안은 수정할 수 없습니다." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "유효한 JSON 본문이 필요합니다." },
      { status: 400 },
    );
  }

  const allowedFields: Record<string, unknown> = {};
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { error: "제목은 비어 있을 수 없습니다." },
        { status: 400 },
      );
    }
    allowedFields.title = body.title.trim();
  }
  if (body.content_html !== undefined) {
    if (typeof body.content_html !== "string") {
      return NextResponse.json(
        { error: "본문은 HTML 문자열이어야 합니다." },
        { status: 400 },
      );
    }
    const normalizedContent = normalizeDraftHtml(body.content_html);
    if (!hasMeaningfulDraftHtml(normalizedContent)) {
      return NextResponse.json(
        { error: "본문은 유효한 HTML이어야 합니다." },
        { status: 400 },
      );
    }
    allowedFields.content_html = normalizedContent;
  }
  if (body.status !== undefined) {
    if (
      typeof body.status !== "string" ||
      !ALLOWED_PATCH_STATUSES.includes(body.status as DraftStatus)
    ) {
      return NextResponse.json(
        { error: "수정 가능한 상태 값이 아닙니다." },
        { status: 400 },
      );
    }
    allowedFields.status = body.status;
  }

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json(
      { error: "수정할 필드가 없습니다." },
      { status: 400 },
    );
  }

  allowedFields.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("content_drafts")
    .update(allowedFields)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "draft")
    .select()
    .single();

  if (error) {
    const { data: latestDraft } = await supabase
      .from("content_drafts")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!latestDraft) {
      return NextResponse.json(
        { error: "초안을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (BLOCKED_EDIT_STATUSES.includes(latestDraft.status as DraftStatus)) {
      return NextResponse.json(
        { error: "발행/예약/보관된 초안은 수정할 수 없습니다." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
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

  const { error } = await supabase
    .from("content_drafts")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
