"use client";

import { useEffect, useState, useCallback } from "react";
import type { ContentDraft } from "@/types/content";

export function useDraft(draftId: string | null) {
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchDraft = useCallback(async () => {
    if (!draftId) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/content/${draftId}`);
      if (res.ok) {
        const data = await res.json();
        setDraft(data as ContentDraft);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const updateDraft = async (
    updates: Partial<Pick<ContentDraft, "title" | "content_html" | "status">>,
  ) => {
    if (!draftId) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/content/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setDraft(data as ContentDraft);
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  return { draft, isLoading, isSaving, updateDraft, refetch: fetchDraft };
}
