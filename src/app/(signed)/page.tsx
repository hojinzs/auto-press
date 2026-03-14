import {
  FileText,
  Zap,
  PenTool,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Wifi,
  Globe,
  Plus,
} from "lucide-react";
import {
  ARCHIVED_DRAFT_STATUS,
  DASHBOARD_ACTIVE_DRAFT_LIMIT,
  DRAFT_LIST_ORDER_COLUMN,
  DRAFT_LIST_ORDER_OPTIONS,
  PUBLISHED_DRAFT_STATUS,
} from "@/lib/drafts";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import type { ContentDraft } from "@/types/content";

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString();
}

type DashboardDraft = Pick<
  ContentDraft,
  "id" | "title" | "status" | "topic" | "credential_id" | "created_at"
>;

interface DashboardConnection {
  id: string;
  site_name: string;
  site_url: string;
  status: string;
  created_at: string;
}

function StatusBadge({ status }: { status: ContentDraft["status"] }) {
  if (status === PUBLISHED_DRAFT_STATUS) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
        <CheckCircle2 className="h-3 w-3" />
        Published
      </span>
    );
  }
  if (status === "scheduled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        <Clock3 className="h-3 w-3" />
        Scheduled
      </span>
    );
  }
  if (status === ARCHIVED_DRAFT_STATUS) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        <FileText className="h-3 w-3" />
        Archived
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
      <FileText className="h-3 w-3" />
      Draft
    </span>
  );
}

function ConnectionStatus({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
      <span className="h-2 w-2 rounded-full bg-amber-500" />
      Error
    </span>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [activeDraftCountResult, publishedResult, connectionsResult, activeDraftsResult] =
    await Promise.all([
      supabase
        .from("content_drafts")
        .select("*", { count: "exact", head: true })
        .neq("status", ARCHIVED_DRAFT_STATUS)
        .neq("status", PUBLISHED_DRAFT_STATUS),
      supabase
        .from("content_drafts")
        .select("*", { count: "exact", head: true })
        .eq("status", PUBLISHED_DRAFT_STATUS),
      supabase
        .from("wp_credentials")
        .select("id, site_name, site_url, status, created_at")
        .order(DRAFT_LIST_ORDER_COLUMN, DRAFT_LIST_ORDER_OPTIONS),
      supabase
        .from("content_drafts")
        .select("id, title, status, topic, credential_id, created_at")
        .neq("status", ARCHIVED_DRAFT_STATUS)
        .neq("status", PUBLISHED_DRAFT_STATUS)
        .order(DRAFT_LIST_ORDER_COLUMN, DRAFT_LIST_ORDER_OPTIONS)
        .limit(DASHBOARD_ACTIVE_DRAFT_LIMIT),
    ]);

  const activeDraftCount = activeDraftCountResult.count ?? 0;
  const publishedCount = publishedResult.count ?? 0;
  const connections = (connectionsResult.data ?? []) as DashboardConnection[];
  const siteNameByCredentialId = new Map(
    connections.map((connection) => [
      connection.id,
      connection.site_name,
    ]),
  );
  const activeDrafts = (activeDraftsResult.data ?? []) as DashboardDraft[];
  const siteCount = connections.length;

  const stats = [
    { label: "ACTIVE DRAFTS", value: activeDraftCount.toString() },
    { label: "PUBLISHED", value: publishedCount.toString() },
    { label: "CONNECTED SITES", value: siteCount.toString() },
  ];

  const quickActions = [
    { label: "New Draft", icon: PenTool, href: "/drafts/new" },
    { label: "All Drafts", icon: FileText, href: "/drafts" },
    { label: "Site Connections", icon: Zap, href: "/settings/connections" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header / Greeting */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-(family-name:--font-newsreader)">
          The Desk
        </h1>
        <p className="text-muted-foreground">
          {activeDraftCount > 0 ? (
            <>
              You have{" "}
              <span className="font-semibold text-foreground">
                {activeDraftCount} active draft{activeDraftCount !== 1 ? "s" : ""}
              </span>{" "}
              and{" "}
              <span className="font-semibold text-foreground">
                {publishedCount} published post{publishedCount !== 1 ? "s" : ""}
              </span>
              .
            </>
          ) : (
            <>Get started by creating your first draft.</>
          )}
        </p>
        {siteCount > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="text-emerald-600 font-medium">
              {siteCount} site{siteCount !== 1 ? "s" : ""}
            </span>{" "}
            connected.
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Drafts */}
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="font-semibold text-lg">Active Drafts</h2>
            {activeDrafts.length > 0 && (
              <Link
                href="/drafts"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          {activeDrafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/20 mb-3" />
              {siteCount === 0 ? (
                <>
                  <p className="text-sm font-medium text-muted-foreground">
                    연동된 사이트가 없습니다
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    초안을 생성하려면 먼저 워드프레스 사이트를 연결해야 합니다.
                  </p>
                  <Link
                    href="/settings/connections"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-medium transition-all hover:scale-105 active:scale-95"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    사이트 연동하기
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-muted-foreground">
                    활성 초안이 없습니다
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI를 활용해 첫 번째 블로그 초안을 생성해보세요.
                  </p>
                  <Link
                    href="/drafts/new"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-medium transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Draft
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {activeDrafts.map((draft) => {
                const siteName = siteNameByCredentialId.get(draft.credential_id);

                return (
                  <Link
                    key={draft.id}
                    href={`/drafts/${draft.id}`}
                    className="flex items-center justify-between gap-4 p-5 hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {draft.title || "제목 없음"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {siteName && (
                          <>
                            <span className="truncate max-w-[140px]">
                              {siteName}
                            </span>
                            <span>·</span>
                          </>
                        )}
                        {draft.topic && (
                          <>
                            <span className="truncate max-w-[200px]">
                              {draft.topic}
                            </span>
                            <span>·</span>
                          </>
                        )}
                        <span>{formatRelativeDate(draft.created_at)}</span>
                      </div>
                    </div>
                    <StatusBadge status={draft.status} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Connection Health */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Connection Health
              </h2>
            </div>
            {connections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <Globe className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  연동된 사이트가 없습니다
                </p>
                <Link
                  href="/settings/connections"
                  className="mt-3 text-xs text-primary hover:underline"
                >
                  사이트 연동하기
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{conn.site_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {conn.site_url}
                      </p>
                    </div>
                    <ConnectionStatus status={conn.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-5 border-b">
              <h2 className="font-semibold text-lg">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary/50 transition-colors"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  {action.label}
                  <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quote */}
          <div className="rounded-xl border bg-card shadow-sm p-5">
            <blockquote className="italic text-sm text-muted-foreground font-(family-name:--font-newsreader) leading-relaxed">
              &ldquo;The essence of editing is the ability to kill your
              darlings.&rdquo;
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
