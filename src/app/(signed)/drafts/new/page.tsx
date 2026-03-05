"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useGenerationJob } from "@/hooks/useGenerationJob";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Globe,
  FileText,
  Sparkles,
  ChevronDown,
  X,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Link2,
  PenTool,
} from "lucide-react";
import Link from "next/link";
import type { GenerationJobStatus } from "@/types/content";

interface SiteOption {
  id: string;
  site_name: string;
  site_url: string;
  status: string;
}

const LENGTH_OPTIONS = [
  { value: 800, label: "짧은 글 (~800 단어)" },
  { value: 1500, label: "보통 글 (~1,500 단어)" },
  { value: 2500, label: "긴 글 (~2,500 단어)" },
  { value: 4000, label: "심층 분석 (~4,000 단어)" },
];

const GEN_STEPS: {
  status: GenerationJobStatus;
  label: string;
  icon: typeof Sparkles;
}[] = [
  { status: "generating", label: "콘텐츠 생성", icon: PenTool },
  { status: "linking", label: "내부 링크 삽입", icon: Link2 },
  { status: "completed", label: "완료", icon: Sparkles },
];

function getStepState(
  stepStatus: GenerationJobStatus,
  currentStatus: GenerationJobStatus,
): "done" | "active" | "pending" | "failed" {
  if (currentStatus === "failed") return "failed";
  const order: GenerationJobStatus[] = ["generating", "linking", "completed"];
  const stepIdx = order.indexOf(stepStatus);
  const currentIdx = order.indexOf(currentStatus);
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

export default function NewDraftPage() {
  const router = useRouter();
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isLoadingSites, setIsLoadingSites] = useState(true);

  const [topic, setTopic] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [targetLength, setTargetLength] = useState(1500);

  const supabase = createClient();
  const { job, isActive, isStarting, error, startGeneration } =
    useGenerationJob(selectedSiteId);

  useEffect(() => {
    const fetchSites = async () => {
      const { data } = await supabase
        .from("wp_credentials")
        .select("id, site_name, site_url, status")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      const siteList = (data || []) as SiteOption[];
      setSites(siteList);
      if (siteList.length > 0) {
        setSelectedSiteId(siteList[0].id);
      }
      setIsLoadingSites(false);
    };

    fetchSites();
  }, []);

  // Redirect on completion
  useEffect(() => {
    if (job?.status === "completed" && job.draft_id) {
      router.push(`/drafts/${job.draft_id}`);
    }
  }, [job?.status, job?.draft_id, router]);

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    await startGeneration({
      topic: topic.trim(),
      keywords,
      target_length: targetLength,
    });
  };

  const progressDetail = job?.progress?.detail || "";
  const progressPercent = job?.progress?.percent || 0;

  if (isLoadingSites) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-6">
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            사이트 정보를 불러오는 중입니다...
          </p>
        </div>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-6">
        <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-2xl text-center px-6">
          <Globe className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-medium">연동된 사이트가 없습니다</h3>
          <Link
            href="/settings/connections"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium"
          >
            사이트 연동하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <header className="mb-10">
        <Link
          href="/drafts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          초안 목록
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">New Draft</h1>
        </div>
        <p className="text-muted-foreground italic">
          AI가 브랜드 보이스에 맞춰 블로그 초안을 생성합니다.
        </p>
      </header>

      {isActive && job ? (
        /* Generation in progress */
        <div className="bg-card border rounded-2xl p-6 space-y-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            콘텐츠 생성 진행 중
          </h3>

          {/* Step indicators */}
          <div className="flex items-center gap-3">
            {GEN_STEPS.map((step, i) => {
              const state = getStepState(step.status, job.status);
              const Icon = step.icon;
              return (
                <div key={step.status} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className={cn(
                        "h-px w-6",
                        state === "done"
                          ? "bg-green-500"
                          : state === "active"
                            ? "bg-primary"
                            : "bg-muted",
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                      state === "done" && "bg-green-50 text-green-700",
                      state === "active" && "bg-primary/10 text-primary",
                      state === "pending" && "bg-muted text-muted-foreground",
                      state === "failed" && "bg-destructive/10 text-destructive",
                    )}
                  >
                    {state === "active" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : state === "done" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : state === "failed" ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{progressDetail}</p>
        </div>
      ) : job?.status === "failed" ? (
        <div className="bg-card border rounded-2xl p-6 space-y-4 text-center">
          <XCircle className="h-10 w-10 text-destructive/40 mx-auto" />
          <p className="text-sm text-destructive">
            {job.error_message || "생성에 실패했습니다."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline"
          >
            다시 시도
          </button>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Site selector */}
          {sites.length > 1 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                사이트 선택
              </label>
              <div className="relative w-full">
                <select
                  value={selectedSiteId || ""}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="w-full appearance-none bg-card border rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.site_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {/* Topic */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
              주제 *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: Next.js 14에서 서버 컴포넌트 활용하기"
              className="w-full bg-card border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
              키워드
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="키워드 입력 후 Enter"
                className="flex-1 bg-card border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-4 py-2.5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                추가
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() =>
                        setKeywords(keywords.filter((k) => k !== kw))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Target length */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
              목표 길이
            </label>
            <div className="relative w-full">
              <select
                value={targetLength}
                onChange={(e) => setTargetLength(Number(e.target.value))}
                className="w-full appearance-none bg-card border rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {LENGTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={isStarting || !topic.trim()}
            className={cn(
              "w-full inline-flex items-center justify-center rounded-full py-3 text-sm font-medium transition-all shadow-lg",
              isStarting || !topic.trim()
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95 shadow-primary/20",
            )}
          >
            {isStarting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            콘텐츠 생성 시작
          </button>
        </form>
      )}
    </div>
  );
}
