import { createAdminClient } from "../_shared/supabase-admin.ts";
import { fetchAllPosts } from "../_shared/wp-client.ts";
import { chunkPost } from "../_shared/chunker.ts";
import { embedTexts } from "../_shared/embedder.ts";
import { generateProfile } from "../_shared/profiler.ts";

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
    const { credential_id, user_id } = await req.json();
    if (!credential_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "credential_id and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createAdminClient();

    // 1. Create collection job
    const { data: job, error: jobError } = await admin
      .from("collection_jobs")
      .insert({
        credential_id,
        user_id,
        status: "collecting",
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error(`Job 생성 실패: ${jobError?.message}`);
    }

    const jobId = job.id;

    // Process in background (return job_id immediately)
    const processPromise = (async () => {
      try {
        // 2. Get decrypted credentials
        const { data: cred, error: credError } = await admin.rpc(
          "get_wp_credential_for_collection",
          { p_credential_id: credential_id, p_user_id: user_id },
        );

        if (credError || !cred) {
          throw new Error(`자격증명 조회 실패: ${credError?.message}`);
        }

        // 3. Collect posts from WP API
        const posts = await fetchAllPosts(
          {
            site_url: cred.site_url,
            wp_username: cred.wp_username,
            wp_app_password: cred.wp_app_password,
          },
          async (collected, total) => {
            await admin.from("collection_jobs").update({
              total_posts: total,
              collected_posts: collected,
            }).eq("id", jobId);
          },
        );

        await admin.from("collection_jobs").update({
          total_posts: posts.length,
          collected_posts: posts.length,
        }).eq("id", jobId);

        if (posts.length === 0) {
          // No posts - save insufficient profile as next version
          const { data: existingProfile } = await admin
            .from("site_profiles")
            .select("version")
            .eq("credential_id", credential_id)
            .eq("user_id", user_id)
            .order("version", { ascending: false })
            .limit(1)
            .maybeSingle();

          const nextVersion = existingProfile ? existingProfile.version + 1 : 1;

          await admin.from("site_profiles").insert({
            credential_id,
            user_id,
            profile_data: {
              status: "insufficient_data",
              message: "게시글이 없어 분석이 불가합니다.",
            },
            version: nextVersion,
          });
          await admin.from("collection_jobs").update({
            status: "completed",
            completed_at: new Date().toISOString(),
          }).eq("id", jobId);
          return;
        }

        // 4. Upsert posts to wp_posts
        for (const post of posts) {
          await admin.from("wp_posts").upsert(
            {
              credential_id,
              user_id,
              wp_post_id: post.wp_post_id,
              title: post.title,
              content: post.content,
              slug: post.slug,
              permalink: post.permalink,
              categories: post.categories,
              tags: post.tags,
              published_at: post.published_at,
              collected_at: new Date().toISOString(),
            },
            { onConflict: "credential_id,wp_post_id" },
          );
        }

        // 5. Embedding phase
        await admin.from("collection_jobs").update({
          status: "embedding",
        }).eq("id", jobId);

        // Get saved posts with IDs
        const { data: savedPosts } = await admin
          .from("wp_posts")
          .select("id, title, content, permalink, categories")
          .eq("credential_id", credential_id)
          .eq("user_id", user_id);

        if (savedPosts) {
          let embeddedCount = 0;

          // Delete existing embeddings for re-collection
          await admin
            .from("post_embeddings")
            .delete()
            .eq("user_id", user_id)
            .in("post_id", savedPosts.map((p) => p.id));

          for (const post of savedPosts) {
            const chunks = chunkPost(post.content);
            if (chunks.length === 0) {
              embeddedCount++;
              continue;
            }

            const texts = chunks.map((c) => c.text);
            const embeddings = await embedTexts(texts);

            const records = chunks.map((chunk, i) => ({
              post_id: post.id,
              user_id,
              chunk_index: chunk.index,
              chunk_text: chunk.text,
              embedding: embeddings[i]
                ? JSON.stringify(embeddings[i])
                : null,
              metadata: {
                title: post.title,
                permalink: post.permalink,
                categories: post.categories,
              },
              status: embeddings[i] ? "active" : "failed",
            }));

            await admin.from("post_embeddings").insert(records);

            embeddedCount++;
            await admin.from("collection_jobs").update({
              embedded_posts: embeddedCount,
            }).eq("id", jobId);
          }
        }

        // 6. Profiling phase
        await admin.from("collection_jobs").update({
          status: "profiling",
        }).eq("id", jobId);

        const postsForProfile = (savedPosts || []).map((p) => ({
          title: p.title,
          content: p.content,
        }));

        const profileData = await generateProfile(postsForProfile);

        // Get current version
        const { data: existingProfile } = await admin
          .from("site_profiles")
          .select("version")
          .eq("credential_id", credential_id)
          .eq("user_id", user_id)
          .order("version", { ascending: false })
          .limit(1)
          .single();

        const nextVersion = existingProfile ? existingProfile.version + 1 : 1;

        await admin.from("site_profiles").insert({
          credential_id,
          user_id,
          profile_data: profileData,
          version: nextVersion,
        });

        // 7. Complete
        await admin.from("collection_jobs").update({
          status: "completed",
          completed_at: new Date().toISOString(),
        }).eq("id", jobId);
      } catch (err) {
        console.error("Collection pipeline error:", err);
        await admin.from("collection_jobs").update({
          status: "failed",
          error_message: err instanceof Error ? err.message : String(err),
          completed_at: new Date().toISOString(),
        }).eq("id", jobId);
      }
    })();

    // Don't await - let it run in background
    // EdgeRuntime.waitUntil keeps the function alive
    EdgeRuntime.waitUntil(processPromise);

    return new Response(
      JSON.stringify({ job_id: jobId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
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
