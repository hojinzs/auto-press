const MAX_CHUNKS_PER_POST = 20;
const MAX_CHUNK_TOKENS = 512;
// Rough estimate: 1 token ≈ 4 chars for English, ~2 chars for Korean
const CHARS_PER_TOKEN = 3;
const MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * CHARS_PER_TOKEN;

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export interface Chunk {
  index: number;
  text: string;
}

export function chunkPost(htmlContent: string): Chunk[] {
  const plainText = stripHtml(htmlContent);
  if (!plainText) return [];

  const paragraphs = splitIntoParagraphs(plainText);
  if (paragraphs.length === 0 && plainText.length > 0) {
    // No paragraph breaks; treat whole text as one block
    return splitBySize(plainText);
  }

  const chunks: Chunk[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if (chunks.length >= MAX_CHUNKS_PER_POST) break;

    if (currentChunk.length + para.length + 1 > MAX_CHUNK_CHARS) {
      if (currentChunk) {
        chunks.push({ index: chunks.length, text: currentChunk.trim() });
      }
      // If single paragraph is too long, split it
      if (para.length > MAX_CHUNK_CHARS) {
        const subChunks = splitBySize(para);
        for (const sc of subChunks) {
          if (chunks.length >= MAX_CHUNKS_PER_POST) break;
          chunks.push({ index: chunks.length, text: sc.text });
        }
      } else {
        currentChunk = para;
      }
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${para}` : para;
    }
  }

  if (currentChunk && chunks.length < MAX_CHUNKS_PER_POST) {
    chunks.push({ index: chunks.length, text: currentChunk.trim() });
  }

  return chunks;
}

function splitBySize(text: string): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;
  while (start < text.length && chunks.length < MAX_CHUNKS_PER_POST) {
    let end = Math.min(start + MAX_CHUNK_CHARS, text.length);
    // Try to break at a sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(". ", end);
      if (lastPeriod > start + MAX_CHUNK_CHARS * 0.5) {
        end = lastPeriod + 1;
      }
    }
    chunks.push({ index: chunks.length, text: text.slice(start, end).trim() });
    start = end;
  }
  return chunks;
}
