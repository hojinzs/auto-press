import { createAdminClient } from "../_shared/supabase-admin.ts";
import { generateContent } from "../_shared/content-generator.ts";
import { insertInternalLinks } from "../_shared/link-inserter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { credential_id, user_id, topic, keywords, target_length } =
      await req.json();

    if (!credential_id || !user_id || !topic) {
      return new Response(
        JSON.stringify({
          error: "credential_id, user_id, and topic are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const admin = createAdminClient();

    // 1. Create generation job
    const { data: job, error: jobError } = await admin
      .from("generation_jobs")
      .insert({
        credential_id,
        user_id,
        status: "pending",
        progress: { step: "pending", detail: "작업 대기 중...", percent: 0 },
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error(`Job 생성 실패: ${jobError?.message}`);
    }

    const jobId = job.id;

    // Process in background
    const processPromise = (async () => {
      const startTime = Date.now();
      try {
        // 2. status → generating: fetch site profile + existing titles
        await admin
          .from("generation_jobs")
          .update({
            status: "generating",
            progress: {
              step: "generating",
              detail: "사이트 프로파일 조회 중...",
              percent: 10,
            },
          })
          .eq("id", jobId);

        // Get site profile
        const { data: profileRow } = await admin
          .from("site_profiles")
          .select("profile_data, version")
          .eq("credential_id", credential_id)
          .eq("user_id", user_id)
          .order("version", { ascending: false })
          .limit(1)
          .single();

        const profileData = (profileRow?.profile_data || {}) as Record<
          string,
          unknown
        >;
        const profileVersion = profileRow?.version || 0;

        // Get existing post titles (to avoid duplicates)
        const { data: existingPosts } = await admin
          .from("wp_posts")
          .select("title")
          .eq("credential_id", credential_id)
          .eq("user_id", user_id);

        const existingTitles = (existingPosts || []).map(
          (p: { title: string }) => p.title,
        );

        await admin
          .from("generation_jobs")
          .update({
            progress: {
              step: "generating",
              detail: "AI 콘텐츠 생성 중...",
              percent: 30,
            },
          })
          .eq("id", jobId);

        // Generate content
        const {
          title,
          contentHtml: rawHtml,
          tokensUsed,
        } = await generateContent({
          topic,
          keywords: keywords || [],
          targetLength: target_length || 1500,
          profileData,
          existingTitles,
        });

        // 3. Create content_drafts record (raw HTML)
        const { data: draft, error: draftError } = await admin
          .from("content_drafts")
          .insert({
            credential_id,
            user_id,
            title,
            content_html: rawHtml,
            topic,
            keywords: keywords || [],
            target_length: target_length || 1500,
            internal_links: [],
            metadata: {
              model_used: "gpt-5-mini",
              tokens_used: tokensUsed,
              generation_duration_ms: Date.now() - startTime,
              profile_version: profileVersion,
            },
            status: "draft",
          })
          .select()
          .single();

        if (draftError || !draft) {
          throw new Error(`Draft 생성 실패: ${draftError?.message}`);
        }

        // 4. status → linking
        await admin
          .from("generation_jobs")
          .update({
            status: "linking",
            progress: {
              step: "linking",
              detail: "내부 링크 삽입 중...",
              percent: 70,
            },
          })
          .eq("id", jobId);

        const { contentHtml: linkedHtml, insertedLinks } =
          await insertInternalLinks(rawHtml, user_id, credential_id, admin);

        // 5. Update content_drafts with linked HTML
        await admin
          .from("content_drafts")
          .update({
            content_html: linkedHtml,
            internal_links: insertedLinks,
            metadata: {
              model_used: "gpt-5-mini",
              tokens_used: tokensUsed,
              generation_duration_ms: Date.now() - startTime,
              profile_version: profileVersion,
            },
          })
          .eq("id", draft.id);

        // 6. status → completed
        await admin
          .from("generation_jobs")
          .update({
            status: "completed",
            draft_id: draft.id,
            progress: {
              step: "completed",
              detail: "생성 완료!",
              percent: 100,
            },
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      } catch (err) {
        console.error("Generation pipeline error:", err);
        await admin
          .from("generation_jobs")
          .update({
            status: "failed",
            error_message: err instanceof Error ? err.message : String(err),
            progress: {
              step: "failed",
              detail: err instanceof Error ? err.message : String(err),
              percent: 0,
            },
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      }
    })();

    EdgeRuntime.waitUntil(processPromise);

    return new Response(JSON.stringify({ job_id: jobId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
