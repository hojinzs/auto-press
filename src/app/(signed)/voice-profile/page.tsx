"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useCollectionJob } from "@/hooks/useCollectionJob";
import { useSiteProfile } from "@/hooks/useSiteProfile";
import { CollectionProgress } from "@/components/CollectionProgress";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Loader2,
  Globe,
  MessageSquare,
  Tag,
  Users,
  BarChart3,
  Sparkles,
  Database,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import type { ProfileData } from "@/types/profiling";

interface SiteOption {
  id: string;
  site_name: string;
  site_url: string;
  status: string;
}

function VoiceProfileDetail({ profileData }: { profileData: ProfileData }) {
  return (
    <div className="space-y-6">
      {/* Brand Voice */}
      {profileData.brand_voice && (
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="h-5 w-5 text-primary" />
            브랜드 보이스
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">톤</p>
              <p className="text-sm">{profileData.brand_voice.tone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">스타일</p>
              <p className="text-sm">{profileData.brand_voice.style}</p>
            </div>
          </div>
          {profileData.brand_voice.characteristics?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">특성</p>
              <div className="flex flex-wrap gap-2">
                {profileData.brand_voice.characteristics.map((c, i) => (
                  <span
                    key={i}
                    className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Topics */}
      {profileData.topics && profileData.topics.length > 0 && (
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Tag className="h-5 w-5 text-primary" />
            주요 주제
          </h3>
          <div className="space-y-3">
            {profileData.topics.map((topic, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{topic.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(topic.frequency * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${topic.frequency * 100}%` }}
                  />
                </div>
                {topic.description && (
                  <p className="text-xs text-muted-foreground">{topic.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reader Persona */}
      {profileData.reader_persona && (
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5 text-primary" />
            독자 페르소나
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">타겟 독자</p>
              <p className="text-sm">{profileData.reader_persona.demographics}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">전문성 수준</p>
              <p className="text-sm">{profileData.reader_persona.expertise_level}</p>
            </div>
          </div>
          {profileData.reader_persona.interests?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">관심사</p>
              <div className="flex flex-wrap gap-2">
                {profileData.reader_persona.interests.map((interest, i) => (
                  <span
                    key={i}
                    className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Patterns */}
      {profileData.content_patterns && (
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-primary" />
            콘텐츠 패턴
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">평균 길이</p>
              <p className="text-sm">{profileData.content_patterns.average_length?.toLocaleString()}자</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">미디어 사용</p>
              <p className="text-sm">{profileData.content_patterns.media_usage}</p>
            </div>
          </div>
          {profileData.content_patterns.common_structures?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">구조 유형</p>
              <div className="flex flex-wrap gap-2">
                {profileData.content_patterns.common_structures.map((s, i) => (
                  <span
                    key={i}
                    className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VoiceProfilePage() {
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isLoadingSites, setIsLoadingSites] = useState(true);

  const supabase = createClient();

  const { profile, isLoading: profileLoading } = useSiteProfile(selectedSiteId);
  const { job, isActive, isStarting, error: collectionError, startCollection } = useCollectionJob(selectedSiteId);

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

  const profileDataRaw = profile?.profile_data as unknown as Record<string, unknown> | undefined;
  const isInsufficientData =
    profile &&
    profileDataRaw &&
    "status" in profileDataRaw &&
    profileDataRaw.status === "insufficient_data";

  const hasProfile = profile && !isInsufficientData;
  const hasNoJobAndNoProfile = !job && !profile && !profileLoading;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Voice Profile</h1>
        </div>
        <p className="text-muted-foreground italic">
          AI가 분석한 블로그의 브랜드 보이스, 주요 주제, 독자 페르소나, 콘텐츠 패턴을 확인하세요.
        </p>
      </header>

      {isLoadingSites ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" />
          <p className="text-sm text-muted-foreground">사이트 정보를 불러오는 중입니다...</p>
        </div>
      ) : sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-2xl text-center px-6">
          <Globe className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-medium">연동된 사이트가 없습니다</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
            Voice Profile을 생성하려면 먼저 워드프레스 사이트를 연동해주세요.
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

          {/* Site name label when single site */}
          {sites.length === 1 && (
            <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>{sites[0].site_name}</span>
              <span className="text-muted-foreground/40">({sites[0].site_url})</span>
            </div>
          )}

          {/* Loading profile */}
          {profileLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" />
              <p className="text-sm text-muted-foreground">프로파일을 불러오는 중입니다...</p>
            </div>
          ) : isActive && job ? (
            /* Collection in progress */
            <div className="bg-card border rounded-2xl p-6 space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Database className="h-5 w-5 text-primary" />
                데이터 수집 진행 중
              </h3>
              <CollectionProgress job={job} />
            </div>
          ) : hasProfile ? (
            /* Profile exists - show detail */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  마지막 업데이트: {new Date(profile!.created_at).toLocaleDateString()} (v{profile!.version})
                </p>
                <button
                  onClick={startCollection}
                  disabled={isStarting}
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg text-xs font-medium px-3 py-1.5 transition-all",
                    isStarting
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  {isStarting ? (
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  ) : (
                    <Database className="mr-1.5 h-3 w-3" />
                  )}
                  프로파일 재생성
                </button>
              </div>
              <VoiceProfileDetail profileData={profile!.profile_data as ProfileData} />
            </div>
          ) : isInsufficientData ? (
            /* Insufficient data */
            <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-2xl text-center px-6">
              <AlertCircle className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium">데이터가 부족합니다</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                {String(
                  profileDataRaw?.message ||
                    "블로그에 충분한 게시글이 없어 프로파일을 생성할 수 없습니다. 더 많은 콘텐츠를 작성한 후 다시 시도해주세요."
                )}
              </p>
              <button
                onClick={startCollection}
                disabled={isStarting}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              >
                {isStarting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                다시 수집하기
              </button>
            </div>
          ) : hasNoJobAndNoProfile ? (
            /* No job and no profile - CTA */
            <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-2xl text-center px-6">
              <Sparkles className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium">Voice Profile을 생성해보세요</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                블로그의 게시글을 분석하여 브랜드 보이스, 주요 주제, 독자 페르소나 등을 파악합니다.
              </p>
              {collectionError && (
                <p className="text-xs text-destructive mt-3">{collectionError}</p>
              )}
              <button
                onClick={startCollection}
                disabled={isStarting}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              >
                {isStarting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                데이터 수집 시작
              </button>
            </div>
          ) : job && job.status === "failed" ? (
            /* Failed job, no profile */
            <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-2xl text-center px-6">
              <AlertCircle className="h-12 w-12 text-destructive/20 mb-4" />
              <h3 className="text-lg font-medium">수집에 실패했습니다</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                {job.error_message || "알 수 없는 오류가 발생했습니다. 다시 시도해주세요."}
              </p>
              <button
                onClick={startCollection}
                disabled={isStarting}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              >
                {isStarting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                다시 시도
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
