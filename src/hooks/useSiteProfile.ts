"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { ProfileData, SiteProfile } from "@/types/profiling";

export function useSiteProfile(credentialId: string | null) {
  const [profile, setProfile] = useState<SiteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!credentialId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_profiles")
        .select("*")
        .eq("credential_id", credentialId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setProfile(null);
        return;
      }

      setProfile(data ? (data as SiteProfile) : null);
    } finally {
      setIsLoading(false);
    }
  }, [credentialId]);

  const saveProfile = async (profileData: ProfileData) => {
    if (!credentialId) {
      throw new Error("사이트가 선택되지 않았습니다.");
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/sites/${credentialId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile_data: profileData }),
      });

      const payload = (await response.json()) as SiteProfile & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "프로필 저장에 실패했습니다.");
      }

      setProfile(payload);
      return payload;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "프로필 저장에 실패했습니다.";
      setSaveError(message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    isSaving,
    saveError,
    refetch: fetchProfile,
    saveProfile,
  };
}
