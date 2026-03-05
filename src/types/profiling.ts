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

export interface SiteProfile {
  id: string;
  credential_id: string;
  user_id: string;
  profile_data: ProfileData;
  version: number;
  created_at: string;
}
