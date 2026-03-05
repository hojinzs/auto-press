import { createAdminClient } from "../_shared/supabase-admin.ts";
import { embedTexts } from "../_shared/embedder.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.85) return "duplicate";
  if (similarity >= 0.70) return "similar";
  return "pass";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, credential_id, user_id, match_count = 5 } = await req
      .json();

    if (!query || !user_id) {
      return new Response(
        JSON.stringify({ error: "query and user_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Generate embedding for the query
    const embeddings = await embedTexts([query]);
    const queryEmbedding = embeddings[0];

    if (!queryEmbedding) {
      return new Response(
        JSON.stringify({ error: "임베딩 생성 실패" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const admin = createAdminClient();

    // Use RPC function for similarity search
    // Note: RPC runs as the calling user for security invoker functions,
    // but since we use admin client we need to pass user context differently.
    // We'll do a direct query instead.
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    const { data, error } = await admin.rpc("search_similar_posts", {
      query_embedding: embeddingStr,
      match_threshold: 0.5,
      match_count: match_count,
      p_credential_id: credential_id || null,
    });

    if (error) {
      throw new Error(`검색 오류: ${error.message}`);
    }

    const results = (data || []).map(
      (item: {
        post_id: string;
        chunk_text: string;
        similarity: number;
        title: string;
        permalink: string;
        metadata: Record<string, unknown>;
      }) => ({
        ...item,
        label: getSimilarityLabel(item.similarity),
      }),
    );

    return new Response(
      JSON.stringify({ results }),
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
