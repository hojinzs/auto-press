export type GenerationJobStatus =
  | "pending"
  | "generating"
  | "linking"
  | "completed"
  | "failed";

export type DraftStatus = "draft" | "published" | "scheduled" | "archived";

export interface GenerationJob {
  id: string;
  draft_id: string | null;
  credential_id: string;
  user_id: string;
  status: GenerationJobStatus;
  progress: {
    step: string;
    detail: string;
    percent: number;
  };
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface InternalLink {
  anchor_text: string;
  href: string;
  post_id: string;
  similarity: number;
}

export interface ContentDraft {
  id: string;
  credential_id: string;
  user_id: string;
  title: string;
  content_html: string;
  topic: string;
  keywords: string[];
  target_length: number;
  internal_links: InternalLink[];
  metadata: {
    model_used?: string;
    tokens_used?: number;
    generation_duration_ms?: number;
    profile_version?: number;
  };
  scheduled_at?: string;
  status: DraftStatus;
  created_at: string;
  updated_at: string;
}

export interface GenerateContentInput {
  credential_id: string;
  topic: string;
  keywords?: string[];
  target_length?: number;
}
