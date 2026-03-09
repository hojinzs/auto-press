"use client";

import { useEffect, useMemo, useState } from "react";
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
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import {
  isInsufficientProfileData,
  normalizeProfileData,
  type ProfileData,
} from "@/types/profiling";

interface SiteOption {
  id: string;
  site_name: string;
  site_url: string;
  status: string;
}

function createEmptyProfileData(): ProfileData {
  return {
    brand_voice: {
      tone: "",
      style: "",
      characteristics: [],
    },
    topics: [],
    reader_persona: {
      demographics: "",
      interests: [],
      expertise_level: "",
    },
    content_patterns: {
      average_length: 0,
      common_structures: [],
      media_usage: "",
    },
  };
}

function cloneProfileData(profileData: ProfileData): ProfileData {
  return {
    brand_voice: {
      tone: profileData.brand_voice.tone,
      style: profileData.brand_voice.style,
      characteristics: [...profileData.brand_voice.characteristics],
    },
    topics: profileData.topics.map((topic) => ({ ...topic })),
    reader_persona: {
      demographics: profileData.reader_persona.demographics,
      interests: [...profileData.reader_persona.interests],
      expertise_level: profileData.reader_persona.expertise_level,
    },
    content_patterns: {
      average_length: profileData.content_patterns.average_length,
      common_structures: [...profileData.content_patterns.common_structures],
      media_usage: profileData.content_patterns.media_usage,
    },
  };
}

function parseListInput(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function VoiceProfileDetail({ profileData }: { profileData: ProfileData }) {
  return (
    <div className="space-y-6">
      {profileData.brand_voice && (
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="h-5 w-5 text-primary" />
            브랜드 보이스
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">톤</p>
              <p className="text-sm">{profileData.brand_voice.tone || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">스타일</p>
              <p className="text-sm">{profileData.brand_voice.style || "-"}</p>
            </div>
          </div>
          {profileData.brand_voice.characteristics.length > 0 && (
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

      {profileData.topics.length > 0 && (
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

      {profileData.reader_persona && (
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5 text-primary" />
            독자 페르소나
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">타겟 독자</p>
              <p className="text-sm">{profileData.reader_persona.demographics || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">전문성 수준</p>
              <p className="text-sm">{profileData.reader_persona.expertise_level || "-"}</p>
            </div>
          </div>
          {profileData.reader_persona.interests.length > 0 && (
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

      {profileData.content_patterns && (
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-primary" />
            콘텐츠 패턴
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">평균 길이</p>
              <p className="text-sm">{profileData.content_patterns.average_length.toLocaleString()}자</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">미디어 사용</p>
              <p className="text-sm">{profileData.content_patterns.media_usage || "-"}</p>
            </div>
          </div>
          {profileData.content_patterns.common_structures.length > 0 && (
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

function VoiceProfileEditor({
  profileData,
  onChange,
}: {
  profileData: ProfileData;
  onChange: (profile: ProfileData) => void;
}) {
  const inputClass =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
  const textareaClass = `${inputClass} min-h-20`;

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-2xl p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5 text-primary" />
          브랜드 보이스
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">톤</label>
            <input
              value={profileData.brand_voice.tone}
              onChange={(e) =>
                onChange({
                  ...profileData,
                  brand_voice: {
                    ...profileData.brand_voice,
                    tone: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">스타일</label>
            <input
              value={profileData.brand_voice.style}
              onChange={(e) =>
                onChange({
                  ...profileData,
                  brand_voice: {
                    ...profileData.brand_voice,
                    style: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            특성 (쉼표/줄바꿈 구분)
          </label>
          <textarea
            value={profileData.brand_voice.characteristics.join(", ")}
            onChange={(e) =>
              onChange({
                ...profileData,
                brand_voice: {
                  ...profileData.brand_voice,
                  characteristics: parseListInput(e.target.value),
                },
              })
            }
            className={textareaClass}
          />
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Tag className="h-5 w-5 text-primary" />
            주요 주제
          </h3>
          <button
            onClick={() =>
              onChange({
                ...profileData,
                topics: [
                  ...profileData.topics,
                  { name: "", frequency: 0.1, description: "" },
                ],
              })
            }
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" />
            주제 추가
          </button>
        </div>
        {profileData.topics.length === 0 ? (
          <p className="text-sm text-muted-foreground">주제를 추가해 주세요.</p>
        ) : (
          <div className="space-y-3">
            {profileData.topics.map((topic, index) => (
              <div key={index} className="border rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5 space-y-2">
                    <label className="text-xs text-muted-foreground">주제명</label>
                    <input
                      value={topic.name}
                      onChange={(e) => {
                        const nextTopics = [...profileData.topics];
                        nextTopics[index] = { ...topic, name: e.target.value };
                        onChange({ ...profileData, topics: nextTopics });
                      }}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-2">
                    <label className="text-xs text-muted-foreground">빈도 (0~1)</label>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={topic.frequency}
                      onChange={(e) => {
                        const nextTopics = [...profileData.topics];
                        const nextFrequency = Number(e.target.value);
                        nextTopics[index] = {
                          ...topic,
                          frequency: Number.isFinite(nextFrequency) ? nextFrequency : 0,
                        };
                        onChange({ ...profileData, topics: nextTopics });
                      }}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-2">
                    <label className="text-xs text-muted-foreground">설명</label>
                    <input
                      value={topic.description}
                      onChange={(e) => {
                        const nextTopics = [...profileData.topics];
                        nextTopics[index] = {
                          ...topic,
                          description: e.target.value,
                        };
                        onChange({ ...profileData, topics: nextTopics });
                      }}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      onClick={() => {
                        const nextTopics = profileData.topics.filter((_, i) => i !== index);
                        onChange({ ...profileData, topics: nextTopics });
                      }}
                      className="inline-flex items-center justify-center rounded-lg border p-2 text-muted-foreground hover:text-destructive hover:border-destructive/30"
                      aria-label="주제 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border rounded-2xl p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-primary" />
          독자 페르소나
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">타겟 독자</label>
            <input
              value={profileData.reader_persona.demographics}
              onChange={(e) =>
                onChange({
                  ...profileData,
                  reader_persona: {
                    ...profileData.reader_persona,
                    demographics: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">전문성 수준</label>
            <input
              value={profileData.reader_persona.expertise_level}
              onChange={(e) =>
                onChange({
                  ...profileData,
                  reader_persona: {
                    ...profileData.reader_persona,
                    expertise_level: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            관심사 (쉼표/줄바꿈 구분)
          </label>
          <textarea
            value={profileData.reader_persona.interests.join(", ")}
            onChange={(e) =>
              onChange({
                ...profileData,
                reader_persona: {
                  ...profileData.reader_persona,
                  interests: parseListInput(e.target.value),
                },
              })
            }
            className={textareaClass}
          />
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="h-5 w-5 text-primary" />
          콘텐츠 패턴
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">평균 길이</label>
            <input
              type="number"
              min={0}
              value={profileData.content_patterns.average_length}
              onChange={(e) =>
                onChange({
                  ...profileData,
                  content_patterns: {
                    ...profileData.content_patterns,
                    average_length: Math.max(0, Number(e.target.value) || 0),
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">미디어 사용</label>
            <input
              value={profileData.content_patterns.media_usage}
              onChange={(e) =>
                onChange({
                  ...profileData,
                  content_patterns: {
                    ...profileData.content_patterns,
                    media_usage: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            구조 유형 (쉼표/줄바꿈 구분)
          </label>
          <textarea
            value={profileData.content_patterns.common_structures.join(", ")}
            onChange={(e) =>
              onChange({
                ...profileData,
                content_patterns: {
                  ...profileData.content_patterns,
                  common_structures: parseListInput(e.target.value),
                },
              })
            }
            className={textareaClass}
          />
        </div>
      </div>
    </div>
  );
}

export default function VoiceProfilePage() {
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [editableProfileData, setEditableProfileData] =
    useState<ProfileData>(createEmptyProfileData());

  const supabase = createClient();

  const {
    profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useSiteProfile(selectedSiteId);
  const {
    job,
    isActive,
    isStarting,
    error: collectionError,
    startCollection,
  } = useCollectionJob(selectedSiteId);

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
  }, [supabase]);

  const profileDataRaw = profile?.profile_data;
  const isInsufficientData = isInsufficientProfileData(profileDataRaw);
  const hasProfile = Boolean(profile && !isInsufficientData);

  const normalizedProfileData = useMemo(() => {
    if (!hasProfile) return null;
    return normalizeProfileData(profileDataRaw);
  }, [hasProfile, profileDataRaw]);

  useEffect(() => {
    if (!normalizedProfileData) {
      setEditableProfileData(createEmptyProfileData());
      setIsEditing(false);
      return;
    }

    setEditableProfileData(cloneProfileData(normalizedProfileData));
  }, [normalizedProfileData]);

  useEffect(() => {
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditing(false);
  }, [selectedSiteId]);

  const hasNoJobAndNoProfile = !job && !profile && !profileLoading;

  const handleSaveProfile = async () => {
    if (!selectedSiteId) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch("/api/profiling/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential_id: selectedSiteId,
          profile_data: editableProfileData,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setSaveError(result.error || "프로파일 저장에 실패했습니다.");
        return;
      }

      setIsEditing(false);
      setSaveSuccess("브랜드 보이스 수정사항이 저장되었습니다.");
      await refetchProfile();
    } catch {
      setSaveError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (normalizedProfileData) {
      setEditableProfileData(cloneProfileData(normalizedProfileData));
    }
    setIsEditing(false);
    setSaveError(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Voice Profile</h1>
        </div>
        <p className="text-muted-foreground italic">
          AI가 분석한 블로그의 브랜드 보이스, 주요 주제, 독자 페르소나, 콘텐츠 패턴을 확인하고 수정할 수 있습니다.
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
              <span className="text-muted-foreground/40">({sites[0].site_url})</span>
            </div>
          )}

          {profileLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" />
              <p className="text-sm text-muted-foreground">프로파일을 불러오는 중입니다...</p>
            </div>
          ) : isActive && job ? (
            <div className="bg-card border rounded-2xl p-6 space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Database className="h-5 w-5 text-primary" />
                데이터 수집 진행 중
              </h3>
              <CollectionProgress job={job} />
            </div>
          ) : hasProfile && normalizedProfileData ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  마지막 업데이트: {new Date(profile!.created_at).toLocaleDateString()} (v{profile!.version})
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={startCollection}
                    disabled={isStarting || isSaving}
                    className={cn(
                      "inline-flex items-center justify-center rounded-lg text-xs font-medium px-3 py-1.5 transition-all",
                      isStarting || isSaving
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

                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        <X className="mr-1.5 h-3 w-3" />
                        취소
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className={cn(
                          "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium",
                          isSaving
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {isSaving ? (
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="mr-1.5 h-3 w-3" />
                        )}
                        저장
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setSaveError(null);
                        setSaveSuccess(null);
                      }}
                      className="inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      <Pencil className="mr-1.5 h-3 w-3" />
                      수정
                    </button>
                  )}
                </div>
              </div>

              {saveError && <p className="text-xs text-destructive">{saveError}</p>}
              {saveSuccess && <p className="text-xs text-primary">{saveSuccess}</p>}

              {isEditing ? (
                <VoiceProfileEditor
                  profileData={editableProfileData}
                  onChange={(nextProfile) =>
                    setEditableProfileData(normalizeProfileData(nextProfile))
                  }
                />
              ) : (
                <VoiceProfileDetail profileData={normalizedProfileData} />
              )}
            </div>
          ) : isInsufficientData ? (
            <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-2xl text-center px-6">
              <AlertCircle className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium">데이터가 부족합니다</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                {profileDataRaw.message ||
                  "블로그에 충분한 게시글이 없어 프로파일을 생성할 수 없습니다. 더 많은 콘텐츠를 작성한 후 다시 시도해주세요."}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                이 상태에서는 프로파일 편집이 비활성화됩니다.
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
