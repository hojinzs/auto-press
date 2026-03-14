"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  ChevronDown,
  Database,
  Globe,
  Loader2,
  MessageSquare,
  PencilLine,
  Plus,
  Save,
  Sparkles,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { CollectionProgress } from "@/components/CollectionProgress";
import { useCollectionJob } from "@/hooks/useCollectionJob";
import { useSiteProfile } from "@/hooks/useSiteProfile";
import {
  buildProfileDataFromForm,
  createEmptyTopicForm,
  createProfileEditorFormState,
  getEditableProfileData,
  type ProfileEditorFormState,
} from "@/lib/site-profile";
import { cn } from "@/lib/utils";
import type { ProfileData } from "@/types/profiling";
import { createClient } from "@/utils/supabase/client";

interface SiteOption {
  id: string;
  site_name: string;
  site_url: string;
  status: string;
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  type?: "text" | "number";
}) {
  const className =
    "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={cn(className, "min-h-24 resize-y")}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
    </label>
  );
}

function VoiceProfileDetail({ profileData }: { profileData: ProfileData }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5 text-primary" />
          브랜드 보이스
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">톤</p>
            <p className="text-sm">{profileData.brand_voice.tone}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">스타일</p>
            <p className="text-sm">{profileData.brand_voice.style}</p>
          </div>
        </div>
        {profileData.brand_voice.characteristics.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">특성</p>
            <div className="flex flex-wrap gap-2">
              {profileData.brand_voice.characteristics.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Tag className="h-5 w-5 text-primary" />
          주요 주제
        </h3>
        <div className="space-y-3">
          {profileData.topics.map((topic, index) => (
            <div key={`${topic.name}-${index}`} className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{topic.name}</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(topic.frequency * 100)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
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

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-primary" />
          독자 페르소나
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">타겟 독자</p>
            <p className="text-sm">{profileData.reader_persona.demographics}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">전문성 수준</p>
            <p className="text-sm">{profileData.reader_persona.expertise_level}</p>
          </div>
        </div>
        {profileData.reader_persona.interests.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">관심사</p>
            <div className="flex flex-wrap gap-2">
              {profileData.reader_persona.interests.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="h-5 w-5 text-primary" />
          콘텐츠 패턴
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">평균 길이</p>
            <p className="text-sm">
              {profileData.content_patterns.average_length.toLocaleString()}자
            </p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">미디어 사용</p>
            <p className="text-sm">{profileData.content_patterns.media_usage}</p>
          </div>
        </div>
        {profileData.content_patterns.common_structures.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">구조 유형</p>
            <div className="flex flex-wrap gap-2">
              {profileData.content_patterns.common_structures.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VoiceProfileEditor({
  form,
  onChange,
}: {
  form: ProfileEditorFormState;
  onChange: (nextForm: ProfileEditorFormState) => void;
}) {
  const updateTopic = (
    index: number,
    field: keyof ProfileEditorFormState["topics"][number],
    value: string,
  ) => {
    onChange({
      ...form,
      topics: form.topics.map((topic, topicIndex) =>
        topicIndex === index ? { ...topic, [field]: value } : topic,
      ),
    });
  };

  const addTopic = () => {
    onChange({
      ...form,
      topics: [...form.topics, createEmptyTopicForm()],
    });
  };

  const removeTopic = (index: number) => {
    onChange({
      ...form,
      topics:
        form.topics.length === 1
          ? [createEmptyTopicForm()]
          : form.topics.filter((_, topicIndex) => topicIndex !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5 text-primary" />
          브랜드 보이스
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="톤" value={form.tone} onChange={(tone) => onChange({ ...form, tone })} />
          <Field
            label="스타일"
            value={form.style}
            onChange={(style) => onChange({ ...form, style })}
          />
        </div>
        <Field
          label="특성"
          value={form.characteristics}
          onChange={(characteristics) => onChange({ ...form, characteristics })}
          multiline
          placeholder="쉼표 또는 줄바꿈으로 구분하세요"
        />
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Tag className="h-5 w-5 text-primary" />
            주요 주제
          </h3>
          <button
            type="button"
            onClick={addTopic}
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >
            <Plus className="h-3.5 w-3.5" />
            주제 추가
          </button>
        </div>
        <div className="space-y-4">
          {form.topics.map((topic, index) => (
            <div key={index} className="rounded-xl border border-dashed p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">주제 {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeTopic(index)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
                <Field
                  label="주제명"
                  value={topic.name}
                  onChange={(value) => updateTopic(index, "name", value)}
                />
                <Field
                  label="빈도 (%)"
                  type="number"
                  value={topic.frequency}
                  onChange={(value) => updateTopic(index, "frequency", value)}
                />
              </div>
              <Field
                label="설명"
                value={topic.description}
                onChange={(value) => updateTopic(index, "description", value)}
                multiline
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-primary" />
          독자 페르소나
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="타겟 독자"
            value={form.demographics}
            onChange={(demographics) => onChange({ ...form, demographics })}
          />
          <Field
            label="전문성 수준"
            value={form.expertiseLevel}
            onChange={(expertiseLevel) => onChange({ ...form, expertiseLevel })}
          />
        </div>
        <Field
          label="관심사"
          value={form.interests}
          onChange={(interests) => onChange({ ...form, interests })}
          multiline
          placeholder="쉼표 또는 줄바꿈으로 구분하세요"
        />
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="h-5 w-5 text-primary" />
          콘텐츠 패턴
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="평균 길이"
            type="number"
            value={form.averageLength}
            onChange={(averageLength) => onChange({ ...form, averageLength })}
          />
          <Field
            label="미디어 사용"
            value={form.mediaUsage}
            onChange={(mediaUsage) => onChange({ ...form, mediaUsage })}
          />
        </div>
        <Field
          label="구조 유형"
          value={form.commonStructures}
          onChange={(commonStructures) => onChange({ ...form, commonStructures })}
          multiline
          placeholder="쉼표 또는 줄바꿈으로 구분하세요"
        />
      </div>
    </div>
  );
}

export default function VoiceProfilePage() {
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editorForm, setEditorForm] = useState<ProfileEditorFormState | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);

  const {
    profile,
    isLoading: profileLoading,
    isSaving,
    saveError,
    saveProfile,
  } = useSiteProfile(selectedSiteId);
  const { job, isActive, isStarting, error: collectionError, startCollection } =
    useCollectionJob(selectedSiteId);

  const profileDataRaw = profile?.profile_data as Record<string, unknown> | undefined;
  const isInsufficientData =
    profileDataRaw &&
    "status" in profileDataRaw &&
    profileDataRaw.status === "insufficient_data";
  const editableProfile = getEditableProfileData(profile?.profile_data);
  const hasProfile = Boolean(editableProfile);
  const hasNoJobAndNoProfile = !job && !profile && !profileLoading;

  useEffect(() => {
    const fetchSites = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("wp_credentials")
        .select("id, site_name, site_url, status")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      const siteList = (data || []) as SiteOption[];
      setSites(siteList);
      setSelectedSiteId((current) => current ?? siteList[0]?.id ?? null);
      setIsLoadingSites(false);
    };

    void fetchSites();
  }, []);

  const handleSave = async () => {
    if (!editorForm) {
      return;
    }

    try {
      setEditorError(null);
      const nextProfile = buildProfileDataFromForm(editorForm);
      await saveProfile(nextProfile);
      setIsEditing(false);
    } catch (error) {
      setEditorError(
        error instanceof Error ? error.message : "프로필 저장에 실패했습니다.",
      );
    }
  };

  const handleCancelEdit = () => {
    if (!editableProfile) {
      return;
    }

    setEditorForm(createProfileEditorFormState(editableProfile));
    setEditorError(null);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    if (!editableProfile) {
      return;
    }

    setEditorForm(createProfileEditorFormState(editableProfile));
    setEditorError(null);
    setIsEditing(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10">
        <div className="mb-1 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Voice Profile</h1>
        </div>
        <p className="italic text-muted-foreground">
          AI가 분석한 블로그의 브랜드 보이스, 주요 주제, 독자 페르소나, 콘텐츠 패턴을 확인하고 수정하세요.
        </p>
      </header>

      {isLoadingSites ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-20">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary/40" />
          <p className="text-sm text-muted-foreground">사이트 정보를 불러오는 중입니다...</p>
        </div>
      ) : sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card px-6 py-24 text-center">
          <Globe className="mb-4 h-12 w-12 text-muted-foreground/20" />
          <h3 className="text-lg font-medium">연동된 사이트가 없습니다</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Voice Profile을 생성하려면 먼저 워드프레스 사이트를 연동해주세요.
          </p>
          <Link
            href="/settings/connections"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Globe className="mr-2 h-4 w-4" />
            사이트 연동하기
          </Link>
        </div>
      ) : (
        <>
          {sites.length > 1 && (
            <div className="mb-8">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                사이트 선택
              </label>
              <div className="relative w-full max-w-xs">
                <select
                  value={selectedSiteId || ""}
                  onChange={(event) => {
                    setSelectedSiteId(event.target.value);
                    setIsEditing(false);
                    setEditorForm(null);
                    setEditorError(null);
                  }}
                  className="w-full appearance-none rounded-xl border bg-card px-4 py-2.5 pr-10 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.site_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-20">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary/40" />
              <p className="text-sm text-muted-foreground">프로파일을 불러오는 중입니다...</p>
            </div>
          ) : isActive && job ? (
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Database className="h-5 w-5 text-primary" />
                데이터 수집 진행 중
              </h3>
              <CollectionProgress job={job} />
            </div>
          ) : hasProfile && editableProfile ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    마지막 업데이트: {new Date(profile!.created_at).toLocaleDateString()} (v
                    {profile!.version})
                  </p>
                  {isEditing && (
                    <p className="text-xs text-muted-foreground">
                      저장 시 최신 프로필을 새 버전으로 추가합니다.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        저장
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted"
                    >
                      <PencilLine className="mr-1.5 h-3.5 w-3.5" />
                      수정하기
                    </button>
                  )}
                  <button
                    onClick={startCollection}
                    disabled={isStarting || isSaving}
                    className={cn(
                      "inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-all",
                      isStarting || isSaving
                        ? "cursor-not-allowed bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary hover:bg-primary/20",
                    )}
                  >
                    {isStarting ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Database className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    프로파일 재생성
                  </button>
                </div>
              </div>

              {(editorError || saveError || collectionError) && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {editorError || saveError || collectionError}
                </div>
              )}

              {isEditing && editorForm ? (
                <VoiceProfileEditor form={editorForm} onChange={setEditorForm} />
              ) : (
                <VoiceProfileDetail profileData={editableProfile} />
              )}
            </div>
          ) : isInsufficientData ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-card px-6 py-24 text-center">
              <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground/20" />
              <h3 className="text-lg font-medium">데이터가 부족합니다</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {String(
                  profileDataRaw?.message ||
                    "블로그에 충분한 게시글이 없어 프로파일을 생성할 수 없습니다. 더 많은 콘텐츠를 작성한 후 다시 시도해주세요.",
                )}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                데이터가 부족한 프로필은 직접 수정할 수 없으며, 게시글 수집 후 다시 생성해야 합니다.
              </p>
              <button
                onClick={startCollection}
                disabled={isStarting}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
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
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-card px-6 py-24 text-center">
              <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/20" />
              <h3 className="text-lg font-medium">Voice Profile을 생성해보세요</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                블로그의 게시글을 분석하여 브랜드 보이스, 주요 주제, 독자 페르소나 등을 파악합니다.
              </p>
              {collectionError && (
                <p className="mt-3 text-xs text-destructive">{collectionError}</p>
              )}
              <button
                onClick={startCollection}
                disabled={isStarting}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
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
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-card px-6 py-24 text-center">
              <AlertCircle className="mb-4 h-12 w-12 text-destructive/20" />
              <h3 className="text-lg font-medium">수집에 실패했습니다</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {job.error_message || "알 수 없는 오류가 발생했습니다. 다시 시도해주세요."}
              </p>
              <button
                onClick={startCollection}
                disabled={isStarting}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
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
