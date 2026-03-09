import type { DraftStatus } from "@/types/content";

export const ARCHIVED_DRAFT_STATUS: DraftStatus = "archived";
export const PUBLISHED_DRAFT_STATUS: DraftStatus = "published";
export const DASHBOARD_ACTIVE_DRAFT_LIMIT = 5;
export const DRAFT_LIST_ORDER_COLUMN = "created_at";
export const DRAFT_LIST_ORDER_OPTIONS = { ascending: false } as const;

export function isVisibleDraftStatus(status: DraftStatus) {
  return status !== ARCHIVED_DRAFT_STATUS;
}

export function isDashboardActiveDraftStatus(status: DraftStatus) {
  return isVisibleDraftStatus(status) && status !== PUBLISHED_DRAFT_STATUS;
}
