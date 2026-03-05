# 기능 명세서: 사이트 프로파일링 및 데이터 수집

## 1. 개요
연동된 워드프레스 사이트의 기존 콘텐츠를 수집하고, 벡터 임베딩으로 변환하여 Supabase에 저장한 뒤, AI가 사이트의 브랜드 보이스(말투), 주요 주제, 타겟 독자층을 프로파일링하는 기능입니다. 프로파일링 결과와 임베딩 데이터는 이후 콘텐츠 생성, 시맨틱 내부 링크 추천, 중복 체크 등 모든 AI 작업의 기반 컨텍스트로 활용됩니다.

---

## 2. 주요 기능

### 2.1 기존 게시글 데이터 수집
* **설명:** 워드프레스 REST API(`GET /wp/v2/posts`)를 사용하여 이미 발행된 게시글들을 안전하게 가져옵니다.
* **수집 항목:**
  * 게시글 제목 및 본문 (HTML/텍스트)
  * 카테고리 및 태그 정보
  * 발행 일자 및 작성자 정보
  * 슬러그(slug) 및 퍼머링크(permalink)
* **트리거 조건:**
  * 사이트 최초 연동 완료 직후 자동 실행
  * 사용자가 대시보드에서 [수집 다시 실행] 버튼으로 수동 실행
* **주요 동작:**
  * 페이지네이션(`per_page=100`, `page` 파라미터)을 활용하여 전체 게시글을 순차 수집합니다.
  * WP REST API의 속도 제한(Rate Limiting)을 준수하며, 요청 간 적절한 딜레이를 적용합니다.
  * 수집은 Supabase Edge Function에서 비동기로 처리되며, 진행 상태를 `collection_jobs` 테이블에 기록합니다.
  * 수집 진행 상태(예: "게시글 50개 중 10개 수집 완료...")를 Supabase Realtime을 통해 대시보드에 실시간 반영합니다.
* **에러 처리:**
  * WP REST API 접근 실패(권한 부족, API 비활성화, 타임아웃) 시 최대 3회 재시도 후 실패 상태로 전환하고 사용자에게 원인을 안내합니다.
  * 부분 수집 실패 시 성공한 데이터는 보존하고, 실패 건만 재시도할 수 있도록 합니다.

### 2.2 콘텐츠 임베딩 및 벡터 데이터베이스 저장
* **설명:** 수집된 텍스트 데이터를 멀티 LLM 파이프라인을 거쳐 벡터(수치화된 데이터)로 변환합니다.
* **임베딩 모델:** OpenAI `text-embedding-3-small` (1536 차원) 기본 사용, 향후 모델 교체 가능하도록 추상화
* **청킹(Chunking) 전략:**
  * 게시글 본문을 단락(paragraph) 단위로 분할하되, 각 청크는 최대 512 토큰을 넘지 않도록 합니다.
  * 제목 + 요약 정보를 각 청크의 메타데이터로 함께 저장하여 검색 정확도를 높입니다.
* **주요 동작:**
  * 변환된 벡터 데이터는 Supabase의 `pgvector` 확장을 활용하여 `post_embeddings` 테이블에 저장됩니다.
  * 벡터 인덱스는 `hnsw` 방식을 사용하여 검색 속도와 정확도를 모두 확보합니다.
  * 임베딩 생성은 배치(batch) 단위(최대 100건)로 처리하여 API 호출 효율을 높입니다.
* **에러 처리:**
  * 임베딩 API 호출 실패 시 지수 백오프(exponential backoff)로 최대 3회 재시도합니다.
  * 실패한 청크는 `failed` 상태로 마킹하여 이후 재처리 대상으로 관리합니다.

### 2.3 사이트 프로파일링 (AI 분석)
* **설명:** 수집된 전체 데이터를 바탕으로 사이트의 정체성을 정의하고, 구조화된 프로필로 저장합니다.
* **분석 항목:**
  * **브랜드 보이스:** 친근한지, 전문적인지, 간결한지 등 말투 스타일과 톤 분석
  * **주요 주제:** 블로그가 다루는 핵심 주제를 카테고리화 (최대 10개)
  * **독자 페르소나:** 어떤 독자들이 대상인지 추론 (연령대, 관심사, 전문성 수준 등)
  * **콘텐츠 패턴:** 평균 글 길이, 자주 사용하는 구조(목록형, 튜토리얼형 등), 미디어 활용 빈도
* **저장 형태:**
  * 분석 결과는 `site_profiles` 테이블에 JSONB 컬럼으로 저장됩니다.
  * 각 사이트당 하나의 프로필을 유지하며, 갱신 시 이전 버전을 `profile_history`로 보존합니다.
* **갱신 정책:**
  * 최초 수집 완료 시 자동 생성
  * 신규 게시글 10건 이상 추가 수집 시 자동 재분석
  * 사용자가 대시보드에서 [프로필 재분석] 버튼으로 수동 갱신
* **활용:** 프로필 데이터는 이후 모든 AI 콘텐츠 생성 시 시스템 프롬프트의 참고 컨텍스트로 주입됩니다.

### 2.4 시맨틱 중복 체크 및 유사도 검색
* **설명:** 새로운 콘텐츠를 생성하거나 외부 소스(뉴스 API 등)에서 정보를 가져올 때, 기존 블로그에 이미 비슷한 내용의 글이 있는지 검사합니다.
* **유사도 기준:**
  * Cosine similarity 0.85 이상: **중복** - 사용자에게 경고 표시, 해당 콘텐츠 생성을 차단하고 기존 글 링크를 안내
  * Cosine similarity 0.70~0.85: **유사** - 사용자에게 알림 표시, 기존 유사 글 목록을 보여주되 진행 여부는 사용자가 결정
  * Cosine similarity 0.70 미만: **통과** - 별도 알림 없이 진행
* **주요 동작:**
  * Supabase의 벡터 유사도 검색(Vector similarity search) RPC 함수를 호출하여 상위 5건의 유사 글을 조회합니다.
  * 검색 결과에 유사도 점수와 해당 게시글 제목/URL을 함께 반환합니다.
* **외부 소스 연동 (향후 확장):**
  * 뉴스 API, RSS 피드 등에서 수집한 외부 콘텐츠도 동일한 중복 체크 파이프라인을 거칩니다.
  * 외부 소스 수집 주기 및 대상 설정은 별도 기능 명세로 정의합니다.

---

## 3. 데이터베이스 스키마

### 3.1 `wp_posts` - 수집된 게시글 저장

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | 내부 고유 식별자 |
| `credential_id` | uuid (FK → wp_credentials.id) | 연동 사이트 참조 |
| `user_id` | uuid (FK → auth.users.id) | 소유 사용자 |
| `wp_post_id` | bigint | 워드프레스 원본 게시글 ID |
| `title` | text | 게시글 제목 |
| `content` | text | 게시글 본문 (HTML) |
| `slug` | text | URL 슬러그 |
| `permalink` | text | 게시글 전체 URL |
| `categories` | jsonb | 카테고리 정보 |
| `tags` | jsonb | 태그 정보 |
| `published_at` | timestamptz | 원본 발행일 |
| `collected_at` | timestamptz | 수집 시각 |

### 3.2 `post_embeddings` - 벡터 임베딩 저장

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | 고유 식별자 |
| `post_id` | uuid (FK → wp_posts.id) | 원본 게시글 참조 |
| `user_id` | uuid (FK → auth.users.id) | 소유 사용자 |
| `chunk_index` | integer | 청크 순서 번호 |
| `chunk_text` | text | 원본 청크 텍스트 |
| `embedding` | vector(1536) | 임베딩 벡터 |
| `metadata` | jsonb | 제목, 카테고리 등 부가 정보 |
| `status` | text | 상태 (`active`, `failed`, `pending`) |
| `created_at` | timestamptz | 생성 시각 |

### 3.3 `site_profiles` - 사이트 프로파일 저장

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | 고유 식별자 |
| `credential_id` | uuid (FK → wp_credentials.id) | 연동 사이트 참조 |
| `user_id` | uuid (FK → auth.users.id) | 소유 사용자 |
| `profile_data` | jsonb | 브랜드 보이스, 주제, 페르소나 등 분석 결과 |
| `version` | integer | 프로필 버전 번호 |
| `created_at` | timestamptz | 생성 시각 |

### 3.4 `collection_jobs` - 수집 작업 상태 관리

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | 고유 식별자 |
| `credential_id` | uuid (FK → wp_credentials.id) | 대상 사이트 |
| `user_id` | uuid (FK → auth.users.id) | 소유 사용자 |
| `status` | text | `pending`, `collecting`, `embedding`, `profiling`, `completed`, `failed` |
| `total_posts` | integer | 전체 게시글 수 |
| `collected_posts` | integer | 수집 완료 건수 |
| `embedded_posts` | integer | 임베딩 완료 건수 |
| `error_message` | text | 실패 시 에러 메시지 |
| `started_at` | timestamptz | 작업 시작 시각 |
| `completed_at` | timestamptz | 작업 완료 시각 |

> 모든 테이블에 RLS(Row Level Security)를 적용하여 `user_id = auth.uid()` 조건으로 데이터 접근을 격리합니다.

---

## 4. 처리 흐름 (Data Flow)

```
[사이트 연동 완료 / 수동 실행]
        │
        ▼
  collection_jobs 생성 (status: pending)
        │
        ▼
  ┌─────────────────────────┐
  │  1. 게시글 수집 (collecting) │
  │  WP REST API 호출        │
  │  → wp_posts 테이블 저장    │
  └─────────┬───────────────┘
            │
            ▼
  ┌─────────────────────────┐
  │  2. 임베딩 생성 (embedding) │
  │  청킹 → 임베딩 API 호출    │
  │  → post_embeddings 저장   │
  └─────────┬───────────────┘
            │
            ▼
  ┌─────────────────────────┐
  │  3. 프로파일링 (profiling)  │
  │  전체 데이터 AI 분석        │
  │  → site_profiles 저장     │
  └─────────┬───────────────┘
            │
            ▼
  collection_jobs 완료 (status: completed)
```

* 각 단계의 진행 상태는 `collection_jobs` 테이블 업데이트를 통해 Supabase Realtime으로 클라이언트에 실시간 전달됩니다.

---

## 5. 엣지 케이스 처리

| 상황 | 처리 방식 |
|---|---|
| 게시글이 0개인 사이트 | 수집 단계를 건너뛰고, 프로필을 "데이터 부족" 상태로 저장. 사용자에게 "게시글이 없어 분석이 불가합니다" 안내 |
| WP REST API가 비활성화된 사이트 | 연결 테스트 단계에서 사전 차단. 수집 중 발견 시 작업 중단 후 안내 |
| 매우 긴 게시글 (10,000자 이상) | 청킹 전략에 따라 다수의 청크로 분할. 청크 수 상한(게시글당 최대 20개) 적용 |
| 이미 수집된 게시글 재수집 | `wp_post_id` 기준으로 중복 판별, 기존 데이터를 업데이트(upsert) 처리 |
| 임베딩 API 쿼터 초과 | 작업을 일시 중단하고 사용자에게 알림. 쿼터 복구 후 이어서 처리 |

---

## 6. 보안 및 정책

* **데이터 접근 격리 (RLS):** 모든 테이블에 Row Level Security를 적용하여 수집/분석된 콘텐츠는 해당 사용자에게만 접근이 허용됩니다.
* **Edge Function 보안:** 수집 및 임베딩 작업을 수행하는 Edge Function은 서비스 롤 키(service_role key)로 실행되며, 클라이언트에 직접 노출되지 않습니다.
* **외부 API 키 관리:** 임베딩 모델 API 키는 Supabase Vault 또는 환경 변수로 안전하게 관리합니다.
* **데이터 보존 정책:** 사용자가 사이트 연동을 해제하면 해당 사이트의 수집 데이터, 임베딩, 프로필을 모두 cascade 삭제합니다.
