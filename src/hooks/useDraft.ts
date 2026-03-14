"use client";

import { useEffect, useState, useCallback } from "react";
import type { ContentDraft } from "@/types/content";

export function useDraft(draftId: string | null) {
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/content/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setDraft(data as ContentDraft);
        setSaveSuccess(true);
        return data as ContentDraft;
      }
      setSaveError(
        typeof data?.error === "string"
          ? data.error
          : "초안 저장에 실패했습니다.",
      );
      return null;
    } catch {
      setSaveError("초안 저장 중 오류가 발생했습니다.");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const clearSaveFeedback = () => {
    setSaveError(null);
    setSaveSuccess(false);
  };

  const publishDraft = async (scheduledAt?: string) => {
    if (!draftId) return;

    setIsPublishing(true);
    try {
      const body: Record<string, string> = {};
      if (scheduledAt) body.scheduled_at = scheduledAt;

      const res = await fetch(`/api/content/${draftId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setDraft(data.draft as ContentDraft);
      }
      return res;
    } catch {
      // ignore
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    draft,
    isLoading,
    isSaving,
    isPublishing,
    saveError,
    saveSuccess,
    updateDraft,
    clearSaveFeedback,
    publishDraft,
    refetch: fetchDraft,
  };
}
