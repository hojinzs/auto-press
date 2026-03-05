"use client";

import type { SiteProfile } from "@/types/profiling";
import { MessageSquare, Tag, Users, BarChart3 } from "lucide-react";

interface SiteProfileCardProps {
  profile: SiteProfile;
}

export function SiteProfileCard({ profile }: SiteProfileCardProps) {
  const data = profile.profile_data as unknown as Record<string, unknown>;

  if ("status" in data && data.status === "insufficient_data") {
    return (
      <div className="bg-muted/30 border border-dashed rounded-xl p-5 text-center">
        <p className="text-sm text-muted-foreground">
          {String(data.message || "데이터가 부족하여 프로파일을 생성할 수 없습니다.")}
        </p>
      </div>
    );
  }

  const profileData = data as unknown as import("@/types/profiling").ProfileData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Brand Voice */}
      {profileData.brand_voice && (
        <div className="bg-card border rounded-xl p-5 space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4 text-primary" />
            브랜드 보이스
          </h4>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">톤:</span>{" "}
              {profileData.brand_voice.tone}
            </p>
            <p>
              <span className="text-muted-foreground">스타일:</span>{" "}
              {profileData.brand_voice.style}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profileData.brand_voice.characteristics?.map((c, i) => (
                <span
                  key={i}
                  className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Topics */}
      {profileData.topics && (
        <div className="bg-card border rounded-xl p-5 space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Tag className="h-4 w-4 text-primary" />
            주요 주제
          </h4>
          <div className="space-y-2">
            {profileData.topics.slice(0, 5).map((topic, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{topic.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${topic.frequency * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {Math.round(topic.frequency * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reader Persona */}
      {profileData.reader_persona && (
        <div className="bg-card border rounded-xl p-5 space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            독자 페르소나
          </h4>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">타겟:</span>{" "}
              {profileData.reader_persona.demographics}
            </p>
            <p>
              <span className="text-muted-foreground">전문성:</span>{" "}
              {profileData.reader_persona.expertise_level}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profileData.reader_persona.interests?.map((interest, i) => (
                <span
                  key={i}
                  className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Patterns */}
      {profileData.content_patterns && (
        <div className="bg-card border rounded-xl p-5 space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-primary" />
            콘텐츠 패턴
          </h4>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">평균 길이:</span>{" "}
              {profileData.content_patterns.average_length?.toLocaleString()}자
            </p>
            <p>
              <span className="text-muted-foreground">미디어:</span>{" "}
              {profileData.content_patterns.media_usage}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profileData.content_patterns.common_structures?.map((s, i) => (
                <span
                  key={i}
                  className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
