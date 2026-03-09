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

export interface ProfileData {
  brand_voice: {
    tone: string;
    style: string;
    characteristics: string[];
  };
  topics: {
    name: string;
    frequency: number;
    description: string;
  }[];
  reader_persona: {
    demographics: string;
    interests: string[];
    expertise_level: string;
  };
  content_patterns: {
    average_length: number;
    common_structures: string[];
    media_usage: string;
  };
}

export interface InsufficientDataProfile {
  status: "insufficient_data";
  message: string;
}

export type SiteProfileData = ProfileData | InsufficientDataProfile;

export interface SiteProfile {
  id: string;
  credential_id: string;
  user_id: string;
  profile_data: SiteProfileData;
  version: number;
  created_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toCleanString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function toCleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toCleanString(item))
    .filter((item) => item.length > 0);
}

function toFrequency(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

function toAverageLength(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

export function isInsufficientProfileData(data: unknown): data is InsufficientDataProfile {
  return isRecord(data) && data.status === "insufficient_data";
}

export function normalizeProfileData(data: unknown): ProfileData {
  const root = isRecord(data) ? data : {};

  const brandVoice = isRecord(root.brand_voice) ? root.brand_voice : {};
  const topics = Array.isArray(root.topics) ? root.topics : [];
  const readerPersona = isRecord(root.reader_persona) ? root.reader_persona : {};
  const contentPatterns = isRecord(root.content_patterns) ? root.content_patterns : {};

  return {
    brand_voice: {
      tone: toCleanString(brandVoice.tone),
      style: toCleanString(brandVoice.style),
      characteristics: toCleanStringArray(brandVoice.characteristics),
    },
    topics: topics
      .map((topic) => {
        if (!isRecord(topic)) return null;
        const name = toCleanString(topic.name);
        if (!name) return null;

        return {
          name,
          frequency: toFrequency(topic.frequency),
          description: toCleanString(topic.description),
        };
      })
      .filter((topic): topic is ProfileData["topics"][number] => topic !== null),
    reader_persona: {
      demographics: toCleanString(readerPersona.demographics),
      interests: toCleanStringArray(readerPersona.interests),
      expertise_level: toCleanString(readerPersona.expertise_level),
    },
    content_patterns: {
      average_length: toAverageLength(contentPatterns.average_length),
      common_structures: toCleanStringArray(contentPatterns.common_structures),
      media_usage: toCleanString(contentPatterns.media_usage),
    },
  };
}
