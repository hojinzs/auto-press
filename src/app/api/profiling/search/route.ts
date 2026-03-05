import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { query, credential_id, match_count } = await request.json();
  if (!query) {
    return NextResponse.json(
      { error: "검색어가 필요합니다." },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const res = await fetch(`${supabaseUrl}/functions/v1/search-similar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query, credential_id, user_id: user.id, match_count }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: `검색 실패: ${data.error || res.statusText}` },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
