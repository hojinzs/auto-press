import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  isInsufficientDataProfile,
  normalizeProfileDataInput,
} from "@/types/profiling";

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

  let profileData;

  try {
    const body = await request.json();
    profileData = normalizeProfileDataInput(body.profile_data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "프로필 데이터 검증에 실패했습니다.",
      },
      { status: 400 },
    );
  }

  const { data: credential, error: credentialError } = await supabase
    .from("wp_credentials")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (credentialError || !credential) {
    return NextResponse.json(
      { error: "해당 사이트를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const { data: latestProfile, error: profileError } = await supabase
    .from("site_profiles")
    .select("version, profile_data")
    .eq("credential_id", id)
    .eq("user_id", user.id)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (profileError || !latestProfile) {
    return NextResponse.json(
      { error: "수정할 기존 보이스 프로필이 없습니다." },
      { status: 404 },
    );
  }

  if (isInsufficientDataProfile(latestProfile.profile_data)) {
    return NextResponse.json(
      {
        error:
          "데이터가 부족한 프로필은 편집할 수 없습니다. 먼저 프로필을 다시 수집해주세요.",
      },
      { status: 409 },
    );
  }

  const { data: insertedProfile, error: insertError } = await supabase
    .from("site_profiles")
    .insert({
      credential_id: id,
      user_id: user.id,
      profile_data: profileData,
      version: latestProfile.version + 1,
    })
    .select("*")
    .single();

  if (insertError || !insertedProfile) {
    return NextResponse.json(
      { error: insertError?.message || "프로필 저장에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json(insertedProfile);
}
