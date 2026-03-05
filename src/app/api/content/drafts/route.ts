import { NextRequest, NextResponse } from "next/server";
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
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (credentialId) {
    query = query.eq("credential_id", credentialId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ drafts: data });
}
