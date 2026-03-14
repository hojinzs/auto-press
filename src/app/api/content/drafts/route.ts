import { NextRequest, NextResponse } from "next/server";
import {
  ARCHIVED_DRAFT_STATUS,
  CREATED_AT_DESC_ORDER_COLUMN,
  CREATED_AT_DESC_ORDER_OPTIONS,
} from "@/lib/drafts";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const credentialId = request.nextUrl.searchParams.get("credential_id");

  let query = supabase
    .from("content_drafts")
    .select("*")
    .neq("status", ARCHIVED_DRAFT_STATUS);

  if (credentialId) {
    query = query.eq("credential_id", credentialId);
  }

  const { data, error } = await query.order(
    CREATED_AT_DESC_ORDER_COLUMN,
    CREATED_AT_DESC_ORDER_OPTIONS,
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ drafts: data });
}
