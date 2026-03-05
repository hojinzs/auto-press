"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { SiteProfile } from "@/types/profiling";

export function useSiteProfile(credentialId: string | null) {
  const [profile, setProfile] = useState<SiteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const fetchProfile = async () => {
    if (!credentialId) return;

    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("site_profiles")
        .select("*")
        .eq("credential_id", credentialId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (data) setProfile(data as SiteProfile);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [credentialId]);

  return { profile, isLoading, refetch: fetchProfile };
}
