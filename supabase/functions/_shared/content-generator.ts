const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-5-mini";

interface ProfileData {
  brand_voice?: {
    tone: string;
    style: string;
    characteristics: string[];
  };
  reader_persona?: {
    demographics: string;
    interests: string[];
    expertise_level: string;
  };
  content_patterns?: {
    average_length: number;
    common_structures: string[];
    media_usage: string;
  };
}

interface GenerateContentInput {
  topic: string;
  keywords: string[];
  targetLength: number;
  profileData: ProfileData;
  existingTitles: string[];
}

interface GenerateContentResult {
  title: string;
  contentHtml: string;
  tokensUsed: number;
}

export async function generateContent(
  input: GenerateContentInput,
): Promise<GenerateContentResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const { topic, keywords, targetLength, profileData, existingTitles } = input;

  const systemPrompt = buildSystemPrompt(profileData);
  const userPrompt = buildUserPrompt(topic, keywords, targetLength, existingTitles);

  const startTime = Date.now();

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: Math.max(4000, targetLength * 3),
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("OpenAI API error response:", errorBody);
    throw new Error(`OpenAI API error: ${res.status} - ${errorBody}`);
  }

  const data = await res.json();
  const text: string = data.choices[0].message.content;
  const tokensUsed: number = data.usage?.total_tokens || 0;

  // Parse: first line as TITLE, rest as HTML
  const lines = text.split("\n");
  let title = topic;
  let contentHtml = text;

  const titleLineIdx = lines.findIndex((l: string) =>
    l.startsWith("TITLE:") || l.startsWith("TITLE :")
  );
  if (titleLineIdx !== -1) {
    title = lines[titleLineIdx].replace(/^TITLE\s*:\s*/, "").trim();
    contentHtml = lines.slice(titleLineIdx + 1).join("\n").trim();
  }

  return { title, contentHtml, tokensUsed };
}

function buildSystemPrompt(profile: ProfileData): string {
  const voiceSection = profile.brand_voice
    ? `
브랜드 보이스:
- 톤: ${profile.brand_voice.tone}
- 스타일: ${profile.brand_voice.style}
- 특성: ${profile.brand_voice.characteristics?.join(", ") || "N/A"}`
    : "";

  const personaSection = profile.reader_persona
    ? `
타겟 독자:
- 인구통계: ${profile.reader_persona.demographics}
- 관심사: ${profile.reader_persona.interests?.join(", ") || "N/A"}
- 전문성: ${profile.reader_persona.expertise_level}`
    : "";

  const patternsSection = profile.content_patterns
    ? `
콘텐츠 패턴:
- 일반적 구조: ${profile.content_patterns.common_structures?.join(", ") || "N/A"}
- 미디어 활용: ${profile.content_patterns.media_usage || "N/A"}`
    : "";

  return `당신은 전문 블로그 콘텐츠 작성자입니다. E-E-A-T(경험, 전문성, 권위, 신뢰) 기준에 맞는 고품질 블로그 글을 작성합니다.

작성 규칙:
1. 첫 줄에 반드시 "TITLE: 제목" 형식으로 제목을 작성
2. 제목 다음 줄부터 HTML 본문 작성
3. h2, h3 태그로 명확한 구조 구성
4. 적절한 곳에 <ul>/<ol> 리스트와 <table> 태그 활용
5. 각 섹션은 충분한 깊이와 실용적 정보 포함
6. 내부 링크는 나중에 자동 삽입되므로 작성하지 않음
${voiceSection}${personaSection}${patternsSection}`;
}

function buildUserPrompt(
  topic: string,
  keywords: string[],
  targetLength: number,
  existingTitles: string[],
): string {
  let prompt = `주제: ${topic}\n목표 단어 수: 약 ${targetLength}단어\n`;

  if (keywords.length > 0) {
    prompt += `키워드: ${keywords.join(", ")}\n`;
  }

  if (existingTitles.length > 0) {
    const titles = existingTitles.slice(0, 20).join("\n- ");
    prompt += `\n기존 글 제목 (중복 방지):\n- ${titles}\n`;
  }

  prompt += `\n위 주제에 대해 SEO 최적화된 블로그 글을 작성해주세요.`;

  return prompt;
}
