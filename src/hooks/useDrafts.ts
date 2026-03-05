"use client";

import { useEffect, useState, useCallback } from "react";
import type { ContentDraft } from "@/types/content";

export function useDrafts(credentialId: string | null) {
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDrafts = useCallback(async () => {
    if (!credentialId) {
      setDrafts([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/content/drafts?credential_id=${credentialId}`,
      );
      const data = await res.json();
      if (res.ok) {
        setDrafts(data.drafts || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [credentialId]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const deleteDraft = async (id: string) => {
    const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    }
  };

  return { drafts, isLoading, refetch: fetchDrafts, deleteDraft };
}
