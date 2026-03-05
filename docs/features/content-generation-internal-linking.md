# 기능 명세서: 지능형 콘텐츠 생성 및 시맨틱 내부 링크 자동화

## 1. 개요
사이트 프로파일링 결과(브랜드 보이스, 독자 페르소나 등)를 기반으로 AI가 SEO 최적화된 블로그 초안을 생성하고, Supabase pgvector를 활용한 벡터 유사도 검색으로 기존 글과 연관성 높은 내부 링크를 자동 삽입하는 핵심 기능입니다.

---

## 2. 주요 기능

### 2.1 콘텐츠 생성 입력
* **설명:** 사용자가 초안 생성에 필요한 파라미터를 입력합니다.
* **경로:** `/drafts/new` (`src/app/(signed)/drafts/new/page.tsx`)
* **입력 항목:**
  * 대상 사이트 선택 - 연동된 워드프레스 사이트 중 선택 (필수, `status = "active"` 조건)
  * 주제 (Topic) - 생성할 글의 핵심 주제 (필수)
  * 키워드 (Keywords) - 본문에 포함시킬 SEO 타겟 키워드, Enter 또는 쉼표로 추가 (선택)
  * 목표 길이 (Target Length) - 선택 옵션:
    * 짧은 글 (~800 단어)
    * 보통 글 (~1,500 단어) - 기본값
    * 긴 글 (~2,500 단어)
    * 심층 분석 (~4,000 단어)
* **사전 조건:**
  * 하나 이상의 워드프레스 사이트가 연동되어 있어야 합니다.
  * 해당 사이트에 대해 동시에 진행 중인 생성 작업이 없어야 합니다 (중복 방지).

### 2.2 시맨틱 중복 체크
* **설명:** 사용자가 주제를 입력할 때 기존 게시글과의 시맨틱 유사도를 검사하여 중복 콘텐츠 생성을 방지합니다.
* **구현 파일:**
  * 프론트엔드: `src/app/(signed)/drafts/new/page.tsx`
  * API: `src/app/api/content/check-duplicate/route.ts`
* **동작 방식:**
  1. 주제 입력 필드에서 텍스트 변경 시 500ms debounce 적용 후 자동으로 `/api/content/check-duplicate`를 호출합니다.
  2. 입력 필드에서 포커스를 잃을 때(blur)에도 아직 체크가 수행되지 않았다면 즉시 검사를 실행합니다.
  3. API에서 Supabase Edge Function(`search-similar`)을 호출하여 벡터 유사도 기반 검색을 수행합니다.
  4. 검색 결과에서 similarity >= 0.7인 항목을 필터링합니다.
* **유사도 레벨 판정:**

| 유사도 범위 | 레벨 | UI 동작 |
|------------|------|---------|
| >= 0.85 | `duplicate` | 빨간색 경고 배너 표시, 제출 버튼 비활성화 (생성 차단) |
| >= 0.70, < 0.85 | `similar` | 노란색 경고 배너 표시 (경고만, 생성 가능) |
| < 0.70 | `pass` | 경고 없음 |

* **UI 피드백:**
  * 검사 중 로딩 인디케이터 표시 ("중복 여부를 확인하는 중...")
  * `duplicate` 레벨: 빨간색 배너에 유사 게시글 목록 (제목, 퍼센트, 퍼마링크) 표시, "이미 유사한 글이 존재합니다. 다른 주제를 선택해 주세요." 메시지
  * `similar` 레벨: 노란색 배너에 유사 게시글 목록 표시, "유사한 주제의 글이 있습니다. 차별화된 내용을 작성해 보세요." 메시지
  * 각 유사 게시글은 외부 링크로 원본 글을 확인할 수 있음
* **API 엔드포인트:** `POST /api/content/check-duplicate`
  * 요청 본문: `{ credential_id: string, topic: string }`
  * 응답: `{ duplicates: [{ title, permalink, similarity, level }], level: "duplicate" | "similar" | "pass" }`
  * 내부적으로 `SUPABASE_SERVICE_ROLE_KEY`를 사용하여 Edge Function 호출
  * 최대 5건의 유사 결과 검색 (`match_count: 5`)

### 2.3 AI 콘텐츠 생성 파이프라인
* **설명:** Supabase Edge Function(`generate-content`)에서 비동기로 실행되는 콘텐츠 생성 파이프라인입니다.
* **AI 모델:** OpenAI `gpt-5-mini`
* **생성 프로세스:**
  1. **프로파일 조회:** 해당 사이트의 최신 `site_profile`(브랜드 보이스, 독자 페르소나, 콘텐츠 패턴)을 조회하여 시스템 프롬프트에 반영합니다.
  2. **중복 방지:** 기존 `wp_posts`의 제목 목록(최대 20건)을 조회하여 유사 제목 생성을 방지합니다.
  3. **콘텐츠 생성:** 프로파일 + 주제 + 키워드 + 목표 길이를 반영한 프롬프트로 OpenAI API를 호출합니다.
  4. **결과 파싱:** 응답의 첫 줄에서 `TITLE:` 접두어로 제목을 추출하고, 나머지를 HTML 본문으로 처리합니다.
* **프롬프트 구성:**
  * **시스템 프롬프트:** E-E-A-T 기준 준수, h2/h3 구조화, 리스트/테이블 활용, 프로파일 기반 톤앤매너 적용
  * **사용자 프롬프트:** 주제, 목표 단어 수, 키워드, 기존 글 제목(중복 방지)
* **토큰 제한:** `max_completion_tokens`은 `target_length * 3` 또는 4,000 중 큰 값

### 2.4 시맨틱 내부 링크 자동 삽입
* **설명:** 생성된 HTML 본문을 분석하여 기존 블로그 글과의 벡터 유사도를 기반으로 관련성 높은 내부 링크를 자동 삽입합니다.
* **처리 프로세스:**
  1. **섹션 분할:** HTML을 `<h2>` 태그 기준으로 섹션 단위로 분할합니다.
  2. **텍스트 추출:** 각 섹션에서 HTML 태그를 제거하고 앞 300자까지의 텍스트를 요약으로 추출합니다.
  3. **임베딩 생성:** 추출된 요약 텍스트들을 OpenAI `text-embedding-3-small`로 벡터화합니다.
  4. **유사 포스트 검색:** Supabase RPC `search_similar_posts_admin`을 호출하여 각 섹션당 유사도 0.6 이상의 기존 글을 최대 3건 검색합니다.
  5. **중복 제거:** `post_id` 기준으로 중복을 제거하고, 유사도 최고값만 유지하여 최대 5건으로 제한합니다.
  6. **앵커 텍스트 생성:** AI(gpt-5-mini)가 본문에서 각 링크 대상 글에 적합한 앵커 텍스트(2~5단어)를 추출합니다. 반드시 본문에 실제로 존재하는 텍스트를 선택합니다.
  7. **링크 삽입:** 본문에서 앵커 텍스트를 찾아 `<a href="...">` 태그로 교체합니다.
* **보호 규칙:**
  * `<a>`, `<h2>`, `<h3>`, `<code>` 태그 내부의 텍스트에는 링크를 삽입하지 않습니다.
  * 같은 앵커 텍스트에 대해 중복 삽입하지 않습니다.
* **삽입된 링크 정보 저장:**
  * 각 링크의 `anchor_text`, `href`, `post_id`, `similarity` 값을 `content_drafts.internal_links`에 JSONB 배열로 저장합니다.

### 2.5 생성 작업 실시간 추적
* **설명:** 콘텐츠 생성 작업의 진행 상태를 Supabase Realtime을 통해 UI에 실시간으로 반영합니다.
* **작업 상태 (GenerationJobStatus):**

| 상태 | 설명 | 진행률 |
|------|------|--------|
| `pending` | 작업 대기 중 | 0% |
| `generating` | 프로파일 조회 및 AI 콘텐츠 생성 중 | 10% -> 30% |
| `linking` | 내부 링크 검색 및 삽입 중 | 70% |
| `completed` | 생성 완료, 초안 저장됨 | 100% |
| `failed` | 오류 발생으로 작업 실패 | - |

* **실시간 UI 업데이트:**
  * `useGenerationJob` 훅이 `generation_jobs` 테이블의 `postgres_changes` 이벤트를 구독합니다.
  * 각 단계(generating -> linking -> completed)별 진행 표시기와 상세 메시지를 실시간으로 업데이트합니다.
  * 생성 완료 시 자동으로 해당 초안 상세 페이지(`/drafts/[id]`)로 리다이렉트합니다.
* **중복 실행 방지:**
  * 동일 사이트에 대해 `pending`, `generating`, `linking` 상태의 작업이 존재하면 새 작업 생성을 차단합니다 (HTTP 409 응답).

---

## 3. 데이터베이스 스키마

### 3.1 `content_drafts` - AI 생성 초안 저장

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | 고유 식별자 |
| `credential_id` | uuid (FK -> wp_credentials.id) | 대상 사이트 |
| `user_id` | uuid (FK -> auth.users.id) | 소유 사용자 |
| `title` | text | 초안 제목 |
| `content_html` | text | 생성된 HTML 본문 (내부 링크 포함) |
| `topic` | text | 입력된 주제 |
| `keywords` | text[] | 입력된 키워드 목록 |
| `target_length` | integer | 목표 단어 수 (기본값: 1500) |
| `internal_links` | jsonb | 삽입된 내부 링크 배열 (`[{anchor_text, href, post_id, similarity}]`) |
| `metadata` | jsonb | 생성 메타데이터 (모델, 토큰, 소요시간, 프로파일 버전, WP 발행 정보) |
| `status` | text | `draft`, `published`, `scheduled`, `archived` |
| `scheduled_at` | timestamptz | 예약 발행 시각 (예약 발행 시 설정) |
| `created_at` | timestamptz | 생성 시각 |
| `updated_at` | timestamptz | 수정 시각 |

### 3.2 `generation_jobs` - 생성 작업 상태 관리

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | 고유 식별자 |
| `draft_id` | uuid (FK -> content_drafts.id, nullable) | 생성된 초안 참조 (완료 시 설정) |
| `credential_id` | uuid (FK -> wp_credentials.id) | 대상 사이트 |
| `user_id` | uuid (FK -> auth.users.id) | 소유 사용자 |
| `status` | text | `pending`, `generating`, `linking`, `completed`, `failed` |
| `progress` | jsonb | 진행 상태 (`{step, detail, percent}`) |
| `error_message` | text | 실패 시 에러 메시지 |
| `started_at` | timestamptz | 작업 시작 시각 |
| `completed_at` | timestamptz | 작업 완료 시각 |

> 두 테이블 모두 RLS가 활성화되어 있으며, `user_id = auth.uid()` 조건으로 데이터 접근이 격리됩니다.
> `generation_jobs` 테이블은 Supabase Realtime publication에 등록되어 실시간 변경 감지가 가능합니다.

---

## 4. 처리 흐름 (Data Flow)

```
[사용자: 주제/키워드/길이 입력]
        |
        v
  시맨틱 중복 체크 (500ms debounce)
  POST /api/content/check-duplicate
  -> Edge Function search-similar 호출
  -> 유사도 >= 0.85: 생성 차단 (duplicate)
  -> 유사도 >= 0.70: 경고 표시 (similar)
  -> 유사도 < 0.70: 통과 (pass)
        |
        v
  POST /api/content/generate
  (중복 작업 확인 -> Edge Function 호출)
        |
        v
  generation_jobs 생성 (status: pending)
        |
        v
  +---------------------------------+
  |  1. 프로파일 조회 (generating)    |
  |  site_profiles 최신 버전 조회     |
  |  기존 글 제목 목록 조회           |
  +-----------+---------------------+
              |
              v
  +---------------------------------+
  |  2. AI 콘텐츠 생성 (generating)   |
  |  OpenAI API 호출 (gpt-5-mini)   |
  |  -> content_drafts 레코드 생성    |
  +-----------+---------------------+
              |
              v
  +---------------------------------+
  |  3. 내부 링크 삽입 (linking)      |
  |  섹션 분할 -> 임베딩 생성          |
  |  -> pgvector 유사도 검색          |
  |  -> AI 앵커 텍스트 생성           |
  |  -> HTML에 <a> 태그 삽입          |
  |  -> content_drafts 업데이트       |
  +-----------+---------------------+
              |
              v
  generation_jobs 완료 (status: completed, draft_id 설정)
        |
        v
  [UI: 초안 상세 페이지로 자동 이동]
```

* Edge Function 내에서 `EdgeRuntime.waitUntil()`로 백그라운드 실행됩니다.
* 각 단계의 진행 상태는 `generation_jobs` 테이블 업데이트를 통해 Supabase Realtime으로 클라이언트에 실시간 전달됩니다.

---

## 5. 엣지 케이스 처리

| 상황 | 처리 방식 |
|---|---|
| 사이트 프로파일이 없는 경우 | 프로파일 없이 기본 프롬프트로 생성 진행 (빈 프로파일 데이터 허용) |
| 기존 게시글이 없는 경우 | 중복 방지 제목 목록 비우고, 내부 링크 삽입 단계에서 유사 결과 없으면 링크 없이 완료 |
| 동일 사이트에 이미 진행 중인 작업 | HTTP 409 Conflict 응답과 함께 기존 `job_id` 반환 |
| OpenAI API 오류 | 에러 메시지를 `generation_jobs.error_message`에 기록하고 `failed` 상태로 전환 |
| 앵커 텍스트가 본문에서 발견되지 않는 경우 | 해당 링크를 건너뛰고 다른 링크 처리 계속 |
| 보호 태그(a, h2, h3, code) 내부 텍스트 | 해당 위치에 링크 삽입을 건너뜀 |
| TITLE: 마커가 없는 AI 응답 | 입력된 topic을 제목으로 사용하고, 전체 응답을 HTML 본문으로 처리 |
| 중복 체크 API 실패 | 실패를 무시하고 사용자가 계속 진행할 수 있도록 처리 (silent fail) |
| 주제 입력 없이 중복 체크 요청 | `dupCheck` 상태를 null로 초기화하고 체크를 수행하지 않음 |

---

## 6. 저장되는 메타데이터

초안의 `metadata` 컬럼에 저장되는 정보:

| 필드 | 타입 | 설명 |
|---|---|---|
| `model_used` | string | 사용된 AI 모델 (예: `gpt-5-mini`) |
| `tokens_used` | number | 생성 시 소비된 총 토큰 수 |
| `generation_duration_ms` | number | 전체 생성 소요 시간 (밀리초) |
| `profile_version` | number | 참조한 사이트 프로파일 버전 |
| `wp_post_id` | number | 워드프레스 발행 후 게시글 ID (발행 시 추가) |
| `wp_post_url` | string | 워드프레스 게시글 URL (발행 시 추가) |
| `wp_post_status` | string | 워드프레스 게시글 상태 (발행 시 추가) |
| `published_at` | string | 발행 시각 ISO 문자열 (발행 시 추가) |

---

## 7. API 명세

| 라우트 | 메서드 | 설명 | 요청 본문 | 응답 |
|---|---|---|---|---|
| `/api/content/generate` | POST | 콘텐츠 생성 시작 | `{credential_id, topic, keywords?, target_length?}` | `{job_id}` |
| `/api/content/check-duplicate` | POST | 시맨틱 중복 체크 | `{credential_id, topic}` | `{duplicates: [{title, permalink, similarity, level}], level}` |
| `/api/content/drafts` | GET | 초안 목록 조회 | 쿼리: `?credential_id=...` | `ContentDraft[]` |
| `/api/content/[id]` | GET | 초안 상세 조회 | - | `ContentDraft` |
| `/api/content/[id]` | PATCH | 초안 수정 | `{title?, content_html?, status?}` | `ContentDraft` |
| `/api/content/[id]` | DELETE | 초안 보관 (soft delete) | - | `{success: true}` |

---

## 8. 보안 및 정책

* **인증 필수:** 모든 API 라우트에서 `supabase.auth.getUser()` 확인 후 미인증 시 401 반환
* **데이터 접근 격리 (RLS):** `content_drafts`, `generation_jobs` 테이블 모두 사용자별 RLS 정책 적용
* **Edge Function 보안:** `SUPABASE_SERVICE_ROLE_KEY`로만 Edge Function 호출 가능, 클라이언트에서 직접 호출 불가
* **OpenAI API 키 관리:** Edge Function 환경 변수로 안전하게 관리, 클라이언트에 노출되지 않음
* **삭제 정책:** 초안 삭제 시 실제 데이터를 삭제하지 않고 `status: archived`로 소프트 삭제 처리

---

## 9. 구현 상태

| 기능 | 상태 | 구현 파일 |
|------|------|-----------|
| 콘텐츠 생성 입력 폼 | 완료 | `src/app/(signed)/drafts/new/page.tsx` |
| 시맨틱 중복 체크 (500ms debounce) | 완료 | `src/app/(signed)/drafts/new/page.tsx`, `src/app/api/content/check-duplicate/route.ts` |
| AI 콘텐츠 생성 파이프라인 | 완료 | Supabase Edge Function `generate-content` |
| 시맨틱 내부 링크 자동 삽입 | 완료 | Supabase Edge Function `generate-content` |
| 생성 작업 실시간 추적 | 완료 | `src/hooks/useGenerationJob.ts` |
| 타입 정의 | 완료 | `src/types/content.ts` |
