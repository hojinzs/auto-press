import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type DuplicateLevel = "duplicate" | "similar" | "pass";

interface DuplicateResult {
  title: string;
  permalink: string;
  similarity: number;
}

function getLevel(similarity: number): DuplicateLevel {
  if (similarity >= 0.85) return "duplicate";
  if (similarity >= 0.7) return "similar";
  return "pass";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { credential_id, topic } = await request.json();

  if (!topic) {
    return NextResponse.json(
      { error: "주제가 필요합니다." },
      { status: 400 },
    );
  }

  // Reuse existing /api/profiling/search internally by calling the Edge Function directly
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const res = await fetch(`${supabaseUrl}/functions/v1/search-similar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      query: topic,
      credential_id: credential_id || null,
      user_id: user.id,
      match_count: 5,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: `중복 검사 실패: ${data.error || res.statusText}` },
      { status: 500 },
    );
  }

  const results: (DuplicateResult & { level: DuplicateLevel })[] = (
    data.results || []
  )
    .filter(
      (item: { similarity: number }) => item.similarity >= 0.7,
    )
    .map(
      (item: { title: string; permalink: string; similarity: number }) => ({
        title: item.title,
        permalink: item.permalink,
        similarity: item.similarity,
        level: getLevel(item.similarity),
      }),
    );

  // Overall level is the highest severity found
  let level: DuplicateLevel = "pass";
  if (results.some((r) => r.level === "duplicate")) {
    level = "duplicate";
  } else if (results.some((r) => r.level === "similar")) {
    level = "similar";
  }

  return NextResponse.json({ duplicates: results, level });
}
