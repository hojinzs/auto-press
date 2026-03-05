import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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

  const body = await request.json();
  const { site_name, wp_password } = body;

  if (!site_name) {
    return NextResponse.json(
      { error: "사이트 이름은 필수입니다." },
      { status: 400 },
    );
  }

  const rpcParams: Record<string, unknown> = {
    p_id: id,
    p_site_name: site_name,
  };
  if (wp_password) {
    rpcParams.p_wp_password = wp_password;
  }

  const { error } = await supabase.rpc("update_wp_credential", rpcParams);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
