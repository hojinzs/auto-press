import { embedTexts } from "./embedder.ts";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-5-mini";

interface InsertedLink {
  anchor_text: string;
  href: string;
  post_id: string;
  similarity: number;
}

interface LinkInsertResult {
  contentHtml: string;
  insertedLinks: InsertedLink[];
}

interface SimilarPost {
  post_id: string;
  title: string;
  permalink: string;
  slug: string;
  similarity: number;
  chunk_text: string;
}

export async function insertInternalLinks(
  contentHtml: string,
  userId: string,
  credentialId: string,
  admin: ReturnType<typeof import("./supabase-admin.ts").createAdminClient>,
): Promise<LinkInsertResult> {
  // 1. Split HTML by <h2> boundaries into sections
  const sections = splitBySections(contentHtml);
  if (sections.length === 0) {
    return { contentHtml, insertedLinks: [] };
  }

  // 2. Extract summary text from each section
  const summaries = sections.map((s) => extractPlainText(s).slice(0, 300));
  const nonEmptySummaries = summaries.filter((s) => s.length > 10);
  if (nonEmptySummaries.length === 0) {
    return { contentHtml, insertedLinks: [] };
  }

  // 3. Embed section summaries
  const embeddings = await embedTexts(nonEmptySummaries);

  // 4. Search similar posts for each section
  const allMatches: SimilarPost[] = [];
  for (let i = 0; i < nonEmptySummaries.length; i++) {
    const embedding = embeddings[i];
    if (!embedding) continue;

    const { data, error } = await admin.rpc("search_similar_posts_admin", {
      query_embedding: JSON.stringify(embedding),
      match_threshold: 0.6,
      match_count: 3,
      p_credential_id: credentialId,
      p_user_id: userId,
    });

    if (!error && data) {
      allMatches.push(...(data as SimilarPost[]));
    }
  }

  // 5. Deduplicate by post_id, keep highest similarity, limit to 5
  const uniqueMatches = deduplicateByPostId(allMatches).slice(0, 5);
  if (uniqueMatches.length === 0) {
    return { contentHtml, insertedLinks: [] };
  }

  // 6. Generate anchor texts via AI
  const anchors = await generateAnchorTexts(contentHtml, uniqueMatches);

  // 7. Insert <a> tags into HTML
  let linkedHtml = contentHtml;
  const insertedLinks: InsertedLink[] = [];

  for (const anchor of anchors) {
    const match = uniqueMatches.find((m) => m.post_id === anchor.post_id);
    if (!match || !anchor.anchor_text) continue;

    const href = match.permalink || `/?p=${match.slug || match.post_id}`;
    const result = insertAnchorTag(linkedHtml, anchor.anchor_text, href);
    if (result.inserted) {
      linkedHtml = result.html;
      insertedLinks.push({
        anchor_text: anchor.anchor_text,
        href,
        post_id: match.post_id,
        similarity: match.similarity,
      });
    }
  }

  return { contentHtml: linkedHtml, insertedLinks };
}

function splitBySections(html: string): string[] {
  const parts = html.split(/(?=<h2[\s>])/i);
  return parts.filter((p) => p.trim().length > 0);
}

function extractPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deduplicateByPostId(matches: SimilarPost[]): SimilarPost[] {
  const map = new Map<string, SimilarPost>();
  for (const m of matches) {
    const existing = map.get(m.post_id);
    if (!existing || m.similarity > existing.similarity) {
      map.set(m.post_id, m);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.similarity - a.similarity);
}

async function generateAnchorTexts(
  contentHtml: string,
  matches: SimilarPost[],
): Promise<{ post_id: string; anchor_text: string }[]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return [];

  const plainContent = extractPlainText(contentHtml).slice(0, 2000);
  const matchDescriptions = matches
    .map((m, i) => `${i + 1}. post_id: ${m.post_id} | 제목: ${m.title}`)
    .join("\n");

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "당신은 내부 링크 최적화 전문가입니다. 블로그 본문에서 관련 글로 링크할 최적의 앵커 텍스트(2~5단어)를 추출합니다. 반드시 본문에 실제로 존재하는 텍스트를 선택하세요. JSON 배열로만 응답하세요.",
        },
        {
          role: "user",
          content: `본문 일부:\n${plainContent}\n\n링크 대상 글:\n${matchDescriptions}\n\n각 대상 글에 대해 본문에서 가장 적합한 앵커 텍스트(2~5단어)를 찾아주세요. 형식: [{"post_id": "...", "anchor_text": "..."}]`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Anchor text generation error:", res.status, errorBody);
    return [];
  }

  try {
    const data = await res.json();
    const text = data.choices[0].message.content;
    const parsed = JSON.parse(text);
    // Handle both { anchors: [...] } and direct array
    const arr = Array.isArray(parsed) ? parsed : parsed.anchors || parsed.links || [];
    return arr;
  } catch {
    return [];
  }
}

function insertAnchorTag(
  html: string,
  anchorText: string,
  href: string,
): { html: string; inserted: boolean } {
  // Escape special regex characters in anchor text
  const escaped = anchorText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Find the anchor text NOT inside existing <a>, <h2>, <h3>, or <code> tags
  // Simple approach: find the text and verify it's not within these tags
  const regex = new RegExp(`(?<![<][^>]*)\\b(${escaped})\\b`, "i");
  const match = html.match(regex);

  if (!match || match.index === undefined) {
    return { html, inserted: false };
  }

  // Verify the match is not inside a tag we want to avoid
  const before = html.substring(0, match.index);
  if (isInsideProtectedTag(before)) {
    return { html, inserted: false };
  }

  const replacement = `<a href="${href}">${match[1]}</a>`;
  const newHtml =
    html.substring(0, match.index) +
    replacement +
    html.substring(match.index + match[0].length);

  return { html: newHtml, inserted: true };
}

function isInsideProtectedTag(textBefore: string): boolean {
  // Check if we're inside an <a>, <h2>, <h3>, or <code> tag
  const protectedTags = ["a", "h2", "h3", "code"];

  for (const tag of protectedTags) {
    const openRegex = new RegExp(`<${tag}[\\s>]`, "gi");
    const closeRegex = new RegExp(`</${tag}>`, "gi");

    let openCount = 0;
    let closeCount = 0;

    let m;
    while ((m = openRegex.exec(textBefore)) !== null) openCount++;
    while ((m = closeRegex.exec(textBefore)) !== null) closeCount++;

    if (openCount > closeCount) return true;
  }

  return false;
}
