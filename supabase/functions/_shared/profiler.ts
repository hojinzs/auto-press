const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-5-mini";

const PROFILE_PROMPT = `당신은 블로그 분석 전문가입니다. 아래 블로그 게시글 목록을 분석하여 사이트 프로필을 JSON으로 작성해주세요.

반드시 아래 JSON 구조를 정확히 따라 응답해주세요 (JSON만 출력, 다른 텍스트 없이):

{
  "brand_voice": {
    "tone": "전반적인 톤 (예: 친근한, 전문적인, 캐주얼한)",
    "style": "문체 스타일 설명",
    "characteristics": ["특징1", "특징2", "특징3"]
  },
  "topics": [
    {
      "name": "주제명",
      "frequency": 0.0~1.0 사이의 빈도 비율,
      "description": "주제 설명"
    }
  ],
  "reader_persona": {
    "demographics": "타겟 독자층 인구통계",
    "interests": ["관심사1", "관심사2"],
    "expertise_level": "초급/중급/고급"
  },
  "content_patterns": {
    "average_length": 평균 글자 수(숫자),
    "common_structures": ["구조1", "구조2"],
    "media_usage": "미디어 활용 빈도 설명"
  }
}

게시글 목록:
`;

export async function generateProfile(
  posts: { title: string; content: string }[],
): Promise<Record<string, unknown>> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const summaries = posts.slice(0, 50).map((p, i) => {
    const plainContent = p.content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
    return `${i + 1}. 제목: ${p.title}\n   내용 요약: ${plainContent}`;
  }).join("\n\n");

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a blog analysis expert. Always respond with valid JSON only." },
        { role: "user", content: PROFILE_PROMPT + summaries },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("OpenAI API error response:", errorBody);
    throw new Error(`OpenAI API error: ${res.status} - ${errorBody}`);
  }

  const data = await res.json();
  const text = data.choices[0].message.content;

  return JSON.parse(text);
}
