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

  const { credential_id } = await request.json();
  if (!credential_id) {
    return NextResponse.json(
      { error: "credential_id가 필요합니다." },
      { status: 400 },
    );
  }

  // Check for already running job
  const { data: existingJobs } = await supabase
    .from("collection_jobs")
    .select("id, status")
    .eq("credential_id", credential_id)
    .in("status", ["pending", "collecting", "embedding", "profiling"])
    .limit(1);

  const existingJob = existingJobs?.[0] ?? null;

  if (existingJob) {
    return NextResponse.json(
      { error: "이미 진행 중인 수집 작업이 있습니다.", job_id: existingJob.id },
      { status: 409 },
    );
  }

  // Invoke Edge Function via fetch
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const res = await fetch(`${supabaseUrl}/functions/v1/collect-posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ credential_id, user_id: user.id }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: `수집 시작 실패: ${data.error || res.statusText}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ job_id: data.job_id });
}
