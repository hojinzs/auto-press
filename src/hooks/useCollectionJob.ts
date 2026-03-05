"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { CollectionJob } from "@/types/profiling";

export function useCollectionJob(credentialId: string | null) {
  const [job, setJob] = useState<CollectionJob | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch latest active job on mount
  useEffect(() => {
    if (!credentialId) return;

    const fetchLatestJob = async () => {
      const { data } = await supabase
        .from("collection_jobs")
        .select("*")
        .eq("credential_id", credentialId)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (data) setJob(data as CollectionJob);
    };

    fetchLatestJob();
  }, [credentialId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!credentialId) return;

    const channel = supabase
      .channel(`collection_jobs:${credentialId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "collection_jobs",
          filter: `credential_id=eq.${credentialId}`,
        },
        (payload) => {
          setJob(payload.new as CollectionJob);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [credentialId]);

  const startCollection = async () => {
    if (!credentialId) return;

    setIsStarting(true);
    setError(null);

    try {
      const res = await fetch("/api/profiling/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential_id: credentialId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      // Job will be updated via realtime subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : "수집 시작 실패");
    } finally {
      setIsStarting(false);
    }
  };

  const isActive = job
    ? ["pending", "collecting", "embedding", "profiling"].includes(job.status)
    : false;

  return { job, isActive, isStarting, error, startCollection };
}
