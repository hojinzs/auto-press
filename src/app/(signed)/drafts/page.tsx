"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useDrafts } from "@/hooks/useDrafts";
import Link from "next/link";
import {
  Loader2,
  Globe,
  FileText,
  Plus,
  Link2,
  ChevronDown,
  Tag,
} from "lucide-react";
import type { ContentDraft } from "@/types/content";

interface SiteOption {
  id: string;
  site_name: string;
  site_url: string;
  status: string;
}

function DraftCard({ draft, onDelete }: { draft: ContentDraft; onDelete: () => void }) {
  return (
    <div className="bg-card border rounded-2xl p-5 space-y-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/drafts/${draft.id}`} className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate hover:text-primary transition-colors">
            {draft.title || "제목 없음"}
          </h3>
        </Link>
        <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {draft.status === "draft" ? "초안" : draft.status === "published" ? "발행됨" : draft.status}
        </span>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-1">
        {draft.topic}
      </p>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {draft.keywords?.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            <span>{draft.keywords.slice(0, 3).join(", ")}</span>
          </div>
        )}
        {draft.internal_links?.length > 0 && (
          <div className="flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            <span>{draft.internal_links.length}개 링크</span>
          </div>
        )}
        <span>{new Date(draft.created_at).toLocaleDateString()}</span>
      </div>

      <div className="flex justify-end">
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

export default function DraftsPage() {
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isLoadingSites, setIsLoadingSites] = useState(true);

  const supabase = createClient();

  const { drafts, isLoading, refetch, deleteDraft } =
    useDrafts(selectedSiteId);

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

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <header className="mb-10">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">
              Content Drafts
            </h1>
          </div>
          {selectedSiteId && (
            <Link
              href="/drafts/new"
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Draft
            </Link>
          )}
        </div>
        <p className="text-muted-foreground italic">
          AI가 생성한 블로그 초안을 관리하고 편집하세요.
        </p>
      </header>

      {isLoadingSites ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            사이트 정보를 불러오는 중입니다...
          </p>
        </div>
      ) : sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-2xl text-center px-6">
          <Globe className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-medium">연동된 사이트가 없습니다</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
            콘텐츠를 생성하려면 먼저 워드프레스 사이트를 연동해주세요.
          </p>
          <Link
            href="/settings/connections"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
          >
            <Globe className="mr-2 h-4 w-4" />
            사이트 연동하기
          </Link>
        </div>
      ) : (
        <>
          {/* Site Selector */}
          {sites.length > 1 && (
            <div className="mb-8">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                사이트 선택
              </label>
              <div className="relative w-full max-w-xs">
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

          {sites.length === 1 && (
            <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>{sites[0].site_name}</span>
              <span className="text-muted-foreground/40">
                ({sites[0].site_url})
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                초안을 불러오는 중입니다...
              </p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-2xl text-center px-6">
              <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium">아직 초안이 없습니다</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                AI를 활용해 브랜드 보이스에 맞는 블로그 초안을 생성해보세요.
              </p>
              <Link
                href="/drafts/new"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                첫 번째 초안 만들기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  onDelete={() => deleteDraft(draft.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
