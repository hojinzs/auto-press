"use client";

import { use, useMemo, useState } from "react";
import { useDraft } from "@/hooks/useDraft";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Link2,
  Tag,
  Clock,
  Cpu,
  Save,
  Trash2,
  Send,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { InternalLink } from "@/types/content";

export default function DraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    draft,
    isLoading,
    isSaving,
    isPublishing,
    saveError,
    saveSuccess,
    updateDraft,
    clearSaveFeedback,
    publishDraft,
  } = useDraft(id);
  const router = useRouter();
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const normalizedTitle = useMemo(() => draftTitle.trim(), [draftTitle]);
  const hasChanges = useMemo(() => {
    if (!draft || !isEditMode) return false;
    return (
      normalizedTitle !== (draft.title ?? "").trim() ||
      draftContent !== (draft.content_html ?? "")
    );
  }, [draft, draftContent, isEditMode, normalizedTitle]);

  const handleDelete = async () => {
    const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/drafts");
    }
  };

  const handlePublishNow = async () => {
    await publishDraft();
  };

  const handleSchedulePublish = async () => {
    if (!scheduledAt) return;
    await publishDraft(new Date(scheduledAt).toISOString());
    setShowScheduler(false);
    setScheduledAt("");
  };

  // Minimum datetime for scheduler: current time formatted for datetime-local input
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const isPublishedOrScheduled = draft?.status === "published" || draft?.status === "scheduled";
  const isEditable = draft?.status === "draft";

  const handleSave = async () => {
    if (!draft || !isEditable || !hasChanges || !normalizedTitle) return;
    await updateDraft({ title: normalizedTitle, content_html: draftContent });
  };

  if (isLoading || !draft) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-6">
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            초안을 불러오는 중입니다...
          </p>
        </div>
      </div>
    );
  }

  const internalLinks = (draft.internal_links || []) as InternalLink[];
  const metadata = draft.metadata || {};

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <header className="mb-8">
        <Link
          href="/drafts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          초안 목록
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Content preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight flex-1">
              {draft.title || "제목 없음"}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSave}
                disabled={isSaving || !isEditable || !hasChanges || !normalizedTitle}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  isSaving || !isEditable || !hasChanges || !normalizedTitle
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/10 text-primary hover:bg-primary/20",
                )}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                저장
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="h-3 w-3" />
                삭제
              </button>
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {saveError}
            </div>
          )}
          {saveSuccess && !saveError && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-300/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              초안이 저장되었습니다.
            </div>
          )}

          {isEditable && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditMode(false);
                  clearSaveFeedback();
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  !isEditMode
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary hover:bg-primary/20",
                )}
              >
                <Eye className="h-3 w-3" />
                미리보기
              </button>
              <button
                onClick={() => {
                  setDraftTitle(draft.title ?? "");
                  setDraftContent(draft.content_html ?? "");
                  setIsEditMode(true);
                  clearSaveFeedback();
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  isEditMode
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary hover:bg-primary/20",
                )}
              >
                <Pencil className="h-3 w-3" />
                편집
              </button>
              {hasChanges && (
                <span className="text-xs text-muted-foreground">저장되지 않은 변경사항</span>
              )}
            </div>
          )}

          {!isEditable && (
            <p className="text-xs text-muted-foreground">
              {draft.status === "archived"
                ? "보관된 초안은 수정할 수 없습니다."
                : "발행 또는 예약된 초안은 수정할 수 없습니다."}
            </p>
          )}

          {isEditMode && isEditable && (
            <div className="bg-card border rounded-2xl p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  제목
                </label>
                <input
                  value={draftTitle}
                  onChange={(e) => {
                    setDraftTitle(e.target.value);
                    clearSaveFeedback();
                  }}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="제목을 입력하세요"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  본문 (HTML)
                </label>
                <textarea
                  value={draftContent}
                  onChange={(e) => {
                    setDraftContent(e.target.value);
                    clearSaveFeedback();
                  }}
                  rows={18}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="<h2>제목</h2><p>내용</p>"
                />
              </div>
            </div>
          )}

          {/* HTML Preview with highlighted internal links */}
          <div className="bg-card border rounded-2xl p-8 sm:p-10">
            <div
              className={cn(
                "prose prose-neutral dark:prose-invert max-w-none",
                // Headings
                "prose-h2:text-xl prose-h2:font-bold prose-h2:tracking-tight prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2",
                "prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3",
                // Paragraphs
                "prose-p:leading-7 prose-p:text-foreground/85",
                // Lists
                "prose-ul:my-4 prose-ol:my-4 prose-li:leading-7 prose-li:text-foreground/85",
                // Links
                "[&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/30 [&_a]:underline-offset-2 [&_a]:font-medium [&_a]:transition-colors hover:[&_a]:decoration-primary/60",
                // Tables
                "prose-table:border prose-table:border-border prose-th:bg-muted/50 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-border",
                // Blockquotes
                "prose-blockquote:border-l-primary/40 prose-blockquote:text-muted-foreground prose-blockquote:not-italic",
                // Code
                "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
                // Strong
                "prose-strong:text-foreground prose-strong:font-semibold",
              )}
              dangerouslySetInnerHTML={{
                __html: isEditMode ? draftContent : draft.content_html,
              }}
            />
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Topic & Keywords */}
          <div className="bg-card border rounded-2xl p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Tag className="h-4 w-4 text-primary" />
              주제 & 키워드
            </h3>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                주제
              </p>
              <p className="text-sm">{draft.topic}</p>
            </div>
            {draft.keywords?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  키워드
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {draft.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Internal Links */}
          {internalLinks.length > 0 && (
            <div className="bg-card border rounded-2xl p-5 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Link2 className="h-4 w-4 text-primary" />
                내부 링크 ({internalLinks.length})
              </h3>
              <div className="space-y-3">
                {internalLinks.map((link, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-sm font-medium text-primary">
                      &quot;{link.anchor_text}&quot;
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {link.href}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      유사도: {Math.round(link.similarity * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-card border rounded-2xl p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Cpu className="h-4 w-4 text-primary" />
              메타데이터
            </h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              {metadata.model_used && (
                <div className="flex justify-between">
                  <span>모델</span>
                  <span className="font-medium text-foreground">
                    {metadata.model_used}
                  </span>
                </div>
              )}
              {metadata.tokens_used && (
                <div className="flex justify-between">
                  <span>토큰 사용</span>
                  <span className="font-medium text-foreground">
                    {metadata.tokens_used.toLocaleString()}
                  </span>
                </div>
              )}
              {metadata.generation_duration_ms && (
                <div className="flex justify-between">
                  <span>생성 시간</span>
                  <span className="font-medium text-foreground">
                    {(metadata.generation_duration_ms / 1000).toFixed(1)}초
                  </span>
                </div>
              )}
              {metadata.profile_version && (
                <div className="flex justify-between">
                  <span>프로파일 버전</span>
                  <span className="font-medium text-foreground">
                    v{metadata.profile_version}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status & Dates */}
          <div className="bg-card border rounded-2xl p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-primary" />
              상태
            </h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>상태</span>
                <span className="font-medium text-foreground">
                  {draft.status === "draft"
                    ? "초안"
                    : draft.status === "published"
                      ? "발행됨"
                      : draft.status === "scheduled"
                        ? "예약됨"
                        : draft.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span>생성일</span>
                <span className="font-medium text-foreground">
                  {new Date(draft.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>수정일</span>
                <span className="font-medium text-foreground">
                  {new Date(draft.updated_at).toLocaleDateString()}
                </span>
              </div>
              {draft.scheduled_at && (
                <div className="flex justify-between">
                  <span>예약 발행일</span>
                  <span className="font-medium text-foreground">
                    {new Date(draft.scheduled_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Publish Actions */}
          <div className="bg-card border rounded-2xl p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Send className="h-4 w-4 text-primary" />
              발행
            </h3>
            {isPublishedOrScheduled ? (
              <p className="text-xs text-muted-foreground">
                {draft.status === "published"
                  ? "이미 발행된 초안입니다."
                  : "예약 발행이 설정되어 있습니다."}
              </p>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handlePublishNow}
                  disabled={isPublishing}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                    isPublishing
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {isPublishing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  즉시 발행
                </button>

                {!showScheduler ? (
                  <button
                    onClick={() => setShowScheduler(true)}
                    disabled={isPublishing}
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                      isPublishing
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary/10 text-primary hover:bg-primary/20",
                    )}
                  >
                    <CalendarClock className="h-3 w-3" />
                    예약 발행
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="datetime-local"
                      min={getMinDateTime()}
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSchedulePublish}
                        disabled={isPublishing || !scheduledAt}
                        className={cn(
                          "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                          isPublishing || !scheduledAt
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/90",
                        )}
                      >
                        {isPublishing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CalendarClock className="h-3 w-3" />
                        )}
                        예약
                      </button>
                      <button
                        onClick={() => {
                          setShowScheduler(false);
                          setScheduledAt("");
                        }}
                        className="flex-1 inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-all"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
