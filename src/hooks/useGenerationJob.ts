"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { GenerationJob, GenerateContentInput } from "@/types/content";

export function useGenerationJob(credentialId: string | null) {
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch latest job on mount
  useEffect(() => {
    if (!credentialId) return;

    const fetchLatestJob = async () => {
      const { data } = await supabase
        .from("generation_jobs")
        .select("*")
        .eq("credential_id", credentialId)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (data) setJob(data as GenerationJob);
    };

    fetchLatestJob();
  }, [credentialId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!credentialId) return;

    const channel = supabase
      .channel(`generation_jobs:${credentialId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "generation_jobs",
          filter: `credential_id=eq.${credentialId}`,
        },
        (payload) => {
          setJob(payload.new as GenerationJob);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [credentialId]);

  const startGeneration = async (input: Omit<GenerateContentInput, "credential_id">) => {
    if (!credentialId) return;

    setIsStarting(true);
    setError(null);

    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential_id: credentialId, ...input }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 시작 실패");
    } finally {
      setIsStarting(false);
    }
  };

  const isActive = job
    ? ["pending", "generating", "linking"].includes(job.status)
    : false;

  return { job, isActive, isStarting, error, startGeneration };
}
