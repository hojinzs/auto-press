import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  isInsufficientProfileData,
  normalizeProfileData,
} from "@/types/profiling";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let payload: { credential_id?: string; profile_data?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "유효한 JSON 요청 본문이 필요합니다." },
      { status: 400 },
    );
  }

  const credentialId = payload.credential_id;
  if (!credentialId) {
    return NextResponse.json(
      { error: "credential_id가 필요합니다." },
      { status: 400 },
    );
  }

  const { data: credential } = await supabase
    .from("wp_credentials")
    .select("id")
    .eq("id", credentialId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!credential) {
    return NextResponse.json(
      { error: "수정할 수 있는 사이트를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const { data: latestProfile } = await supabase
    .from("site_profiles")
    .select("version, profile_data")
    .eq("credential_id", credentialId)
    .eq("user_id", user.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestProfile) {
    return NextResponse.json(
      { error: "수정할 프로파일이 없습니다. 먼저 프로파일을 생성해주세요." },
      { status: 409 },
    );
  }

  if (isInsufficientProfileData(latestProfile.profile_data)) {
    return NextResponse.json(
      { error: "데이터가 부족한 상태의 프로파일은 수정할 수 없습니다." },
      { status: 409 },
    );
  }

  const normalizedProfile = normalizeProfileData(payload.profile_data);
  const nextVersion = latestProfile.version + 1;

  const { data: insertedProfile, error: insertError } = await supabase
    .from("site_profiles")
    .insert({
      credential_id: credentialId,
      user_id: user.id,
      profile_data: normalizedProfile,
      version: nextVersion,
    })
    .select("*")
    .single();

  if (insertError || !insertedProfile) {
    return NextResponse.json(
      {
        error: `프로파일 저장에 실패했습니다: ${insertError?.message || "알 수 없는 오류"}`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ profile: insertedProfile });
}
