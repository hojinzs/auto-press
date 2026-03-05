const OPENAI_API_URL = "https://api.openai.com/v1/embeddings";
const MODEL = "text-embedding-3-small";
const MAX_BATCH_SIZE = 100;
const MAX_RETRIES = 3;

export async function embedTexts(
  texts: string[],
): Promise<(number[] | null)[]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const results: (number[] | null)[] = new Array(texts.length).fill(null);

  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);
    const embeddings = await embedBatchWithRetry(batch, apiKey);

    for (let j = 0; j < embeddings.length; j++) {
      results[i + j] = embeddings[j];
    }
  }

  return results;
}

async function embedBatchWithRetry(
  texts: string[],
  apiKey: string,
): Promise<(number[] | null)[]> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: texts,
          model: MODEL,
        }),
      });

      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error(`OpenAI API error: ${res.status}`);
      }

      const data = await res.json();
      return data.data.map(
        (item: { embedding: number[] }) => item.embedding,
      );
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) {
        console.error("Embedding failed after retries:", err);
        return texts.map(() => null);
      }
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return texts.map(() => null);
}
