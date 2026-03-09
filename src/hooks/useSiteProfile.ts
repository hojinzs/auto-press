"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { SiteProfile } from "@/types/profiling";

export function useSiteProfile(credentialId: string | null) {
  const [profile, setProfile] = useState<SiteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    if (!credentialId) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("site_profiles")
        .select("*")
        .eq("credential_id", credentialId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      setProfile(data ? (data as SiteProfile) : null);
    } finally {
      setIsLoading(false);
    }
  }, [credentialId, supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, isLoading, refetch: fetchProfile };
}
