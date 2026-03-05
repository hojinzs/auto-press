"use client";

import type { CollectionJob, CollectionJobStatus } from "@/types/profiling";
import { cn } from "@/lib/utils";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Database,
  Brain,
  FileText,
  Sparkles,
} from "lucide-react";

const STEPS: {
  status: CollectionJobStatus;
  label: string;
  icon: typeof Database;
}[] = [
  { status: "collecting", label: "게시글 수집", icon: FileText },
  { status: "embedding", label: "임베딩 생성", icon: Database },
  { status: "profiling", label: "프로파일링", icon: Brain },
  { status: "completed", label: "완료", icon: Sparkles },
];

function getStepState(
  stepStatus: CollectionJobStatus,
  currentStatus: CollectionJobStatus,
): "done" | "active" | "pending" | "failed" {
  if (currentStatus === "failed") return "failed";

  const order: CollectionJobStatus[] = [
    "collecting",
    "embedding",
    "profiling",
    "completed",
  ];
  const stepIdx = order.indexOf(stepStatus);
  const currentIdx = order.indexOf(currentStatus);

  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

interface CollectionProgressProps {
  job: CollectionJob;
}

export function CollectionProgress({ job }: CollectionProgressProps) {
  const progressText = (() => {
    switch (job.status) {
      case "collecting":
        return job.total_posts > 0
          ? `${job.collected_posts} / ${job.total_posts}개 수집 중...`
          : "게시글 수집 중...";
      case "embedding":
        return job.total_posts > 0
          ? `${job.embedded_posts} / ${job.total_posts}개 임베딩 중...`
          : "임베딩 생성 중...";
      case "profiling":
        return "AI 분석 중...";
      case "completed":
        return "모든 작업이 완료되었습니다.";
      case "failed":
        return job.error_message || "작업이 실패했습니다.";
      default:
        return "대기 중...";
    }
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {STEPS.map((step, i) => {
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

      {/* Progress bar for collecting/embedding */}
      {(job.status === "collecting" || job.status === "embedding") &&
        job.total_posts > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(
                  ((job.status === "collecting"
                    ? job.collected_posts
                    : job.embedded_posts) /
                    job.total_posts) *
                    100,
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      <p
        className={cn(
          "text-xs",
          job.status === "failed"
            ? "text-destructive"
            : "text-muted-foreground",
        )}
      >
        {progressText}
      </p>
    </div>
  );
}
