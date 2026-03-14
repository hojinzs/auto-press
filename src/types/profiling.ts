export type CollectionJobStatus =
  | "pending"
  | "collecting"
  | "embedding"
  | "profiling"
  | "completed"
  | "failed";

export interface CollectionJob {
  id: string;
  credential_id: string;
  user_id: string;
  status: CollectionJobStatus;
  total_posts: number;
  collected_posts: number;
  embedded_posts: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface WpPost {
  id: string;
  credential_id: string;
  user_id: string;
  wp_post_id: number;
  title: string;
  content: string;
  slug: string;
  permalink: string;
  categories: unknown[];
  tags: unknown[];
  published_at: string;
  collected_at: string;
}

export interface PostEmbedding {
  id: string;
  post_id: string;
  user_id: string;
  chunk_index: number;
  chunk_text: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  status: "active" | "failed" | "pending";
  created_at: string;
}

export interface BrandVoice {
  tone: string;
  style: string;
  characteristics: string[];
}

export interface ProfileTopic {
  name: string;
  frequency: number;
  description: string;
}

export interface ReaderPersona {
  demographics: string;
  interests: string[];
  expertise_level: string;
}

export interface ContentPatterns {
  average_length: number;
  common_structures: string[];
  media_usage: string;
}

export interface ProfileData {
  brand_voice: BrandVoice;
  topics: ProfileTopic[];
  reader_persona: ReaderPersona;
  content_patterns: ContentPatterns;
}

export interface InsufficientDataProfile {
  status: "insufficient_data";
  message: string;
}

export type SiteProfileData = ProfileData | InsufficientDataProfile;

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asTrimmedString(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeTopicFrequency(value: unknown): number {
  const raw =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(raw)) {
    return 0;
  }

  if (raw > 1 && raw <= 100) {
    return raw / 100;
  }

  return Math.max(0, Math.min(1, raw));
}

function requireNonEmptyString(value: unknown, fieldName: string): string {
  const normalized = asTrimmedString(value);

  if (!normalized) {
    throw new Error(`${fieldName}은(는) 비워둘 수 없습니다.`);
  }

  return normalized;
}

export function isInsufficientDataProfile(
  value: unknown,
): value is InsufficientDataProfile {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    value.status === "insufficient_data"
  );
}

export function normalizeProfileDataInput(input: unknown): ProfileData {
  if (typeof input !== "object" || input === null) {
    throw new Error("프로필 데이터 형식이 올바르지 않습니다.");
  }

  const record = input as Record<string, unknown>;
  const topics = Array.isArray(record.topics) ? record.topics : [];

  const normalizedTopics = topics
    .map((topic) => {
      if (typeof topic !== "object" || topic === null) {
        return null;
      }

      const topicRecord = topic as Record<string, unknown>;
      const name = asTrimmedString(topicRecord.name);
      const description = asTrimmedString(topicRecord.description);

      if (!name) {
        return null;
      }

      return {
        name,
        frequency: normalizeTopicFrequency(topicRecord.frequency),
        description,
      };
    })
    .filter((topic): topic is ProfileTopic => topic !== null);

  const normalizedProfile = {
    brand_voice: {
      tone: requireNonEmptyString(record.brand_voice && (record.brand_voice as Record<string, unknown>).tone, "브랜드 보이스 톤"),
      style: requireNonEmptyString(record.brand_voice && (record.brand_voice as Record<string, unknown>).style, "브랜드 보이스 스타일"),
      characteristics: normalizeStringList(
        record.brand_voice &&
          (record.brand_voice as Record<string, unknown>).characteristics,
      ),
    },
    topics: normalizedTopics,
    reader_persona: {
      demographics: requireNonEmptyString(
        record.reader_persona &&
          (record.reader_persona as Record<string, unknown>).demographics,
        "독자 페르소나 타겟 독자",
      ),
      interests: normalizeStringList(
        record.reader_persona &&
          (record.reader_persona as Record<string, unknown>).interests,
      ),
      expertise_level: requireNonEmptyString(
        record.reader_persona &&
          (record.reader_persona as Record<string, unknown>).expertise_level,
        "독자 페르소나 전문성 수준",
      ),
    },
    content_patterns: {
      average_length: Math.max(
        0,
        Number(
          record.content_patterns &&
            (record.content_patterns as Record<string, unknown>).average_length,
        ) || 0,
      ),
      common_structures: normalizeStringList(
        record.content_patterns &&
          (record.content_patterns as Record<string, unknown>).common_structures,
      ),
      media_usage: requireNonEmptyString(
        record.content_patterns &&
          (record.content_patterns as Record<string, unknown>).media_usage,
        "콘텐츠 패턴 미디어 사용",
      ),
    },
  };

  if (normalizedProfile.topics.length === 0) {
    throw new Error("주제는 최소 1개 이상 필요합니다.");
  }

  if (normalizedProfile.content_patterns.average_length <= 0) {
    throw new Error("콘텐츠 평균 길이는 1 이상이어야 합니다.");
  }

  return normalizedProfile;
}

export interface SiteProfile {
  id: string;
  credential_id: string;
  user_id: string;
  profile_data: SiteProfileData;
  version: number;
  created_at: string;
}

export function createEmptyProfileData(): ProfileData {
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
