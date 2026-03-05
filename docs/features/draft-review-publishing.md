# 기능 명세서: 휴먼 인 더 루프 검수 및 발행 제어

## 1. 개요
AI가 생성한 콘텐츠 초안을 사용자가 검토, 편집, 관리하고 워드프레스에 원격 발행하는 기능입니다. 초안 목록 관리, 상세 미리보기, 내부 링크 확인, 메타데이터 조회, 워드프레스 REST API를 통한 즉시 발행 및 예약 발행까지의 전체 워크플로우를 지원합니다.

---

## 2. 주요 기능

### 2.1 초안 목록 관리
* **설명:** 사이트별로 생성된 초안들을 목록 형태로 조회하고 관리합니다.
* **경로:** `/drafts`
* **기능 상세:**
  * **사이트 필터링:** 여러 사이트가 연동된 경우 드롭다운으로 사이트를 선택하여 해당 사이트의 초안만 조회합니다.
  * **초안 카드:** 각 초안은 카드 형태로 표시되며, 제목, 주제, 키워드(최대 3개), 내부 링크 수, 생성일, 상태를 포함합니다.
  * **상태 표시:** `초안`, `발행됨`, `예약됨` 등 상태를 뱃지로 표시합니다.
  * **빠른 삭제:** 카드에서 바로 삭제 버튼으로 초안을 보관 처리할 수 있습니다.
  * **새 초안 생성:** 상단의 [New Draft] 버튼으로 초안 생성 페이지로 이동합니다.
* **빈 상태 처리:**
  * 연동된 사이트가 없는 경우: 사이트 연동 페이지로 안내
  * 초안이 없는 경우: 첫 번째 초안 만들기 버튼 제공

### 2.2 초안 상세 검토
* **설명:** 개별 초안의 전체 내용을 미리보고, 관련 정보를 확인합니다.
* **경로:** `/drafts/[id]` (`src/app/(signed)/drafts/[id]/page.tsx`)
* **레이아웃:** 2열 구성 (데스크톱 기준)
  * **왼쪽 (2/3):** HTML 콘텐츠 미리보기
  * **오른쪽 (1/3):** 사이드바 (주제/키워드, 내부 링크, 메타데이터, 상태, 발행 액션)
* **콘텐츠 미리보기:**
  * 생성된 HTML을 Tailwind Typography(`prose`) 스타일로 렌더링합니다.
  * 삽입된 내부 링크는 프라이머리 컬러로 하이라이트됩니다.
  * h2, h3 제목, 리스트, 테이블, 인용문, 코드 블록 등 다양한 HTML 요소를 스타일링합니다.
* **사이드바 정보:**
  * **주제 & 키워드:** 생성 시 입력된 주제와 키워드 태그
  * **내부 링크 목록:** 자동 삽입된 각 링크의 앵커 텍스트, URL, 유사도 점수
  * **메타데이터:** 사용 모델, 토큰 사용량, 생성 소요시간, 프로파일 버전
  * **상태 정보:** 현재 상태(초안/발행됨/예약됨), 생성일, 수정일, 예약 발행일(예약 시), 발행일(발행 시), 워드프레스 링크(발행 시)
  * **발행 액션:** 즉시 발행 버튼, 예약 발행 UI

### 2.3 초안 편집
* **설명:** 생성된 초안의 제목과 본문을 수정할 수 있습니다.
* **수정 가능 항목:**
  * 제목 (`title`)
  * HTML 본문 (`content_html`)
  * 상태 (`status`)
* **주요 동작:**
  * [저장] 버튼 클릭 시 `PATCH /api/content/[id]`를 호출하여 변경사항을 저장합니다.
  * 저장 중에는 로딩 인디케이터를 표시하고 버튼을 비활성화합니다.
  * `updated_at` 타임스탬프가 자동으로 갱신됩니다.
* **구현:** `useDraft` 훅 (`src/hooks/useDraft.ts`)의 `updateDraft()` 메서드 사용

### 2.4 워드프레스 즉시 발행
* **설명:** 검토 완료된 초안을 워드프레스 REST API를 통해 즉시 원격 발행합니다.
* **경로:** `POST /api/content/[id]/publish` (`src/app/api/content/[id]/publish/route.ts`)
* **발행 프로세스:**
  1. 초안 상태가 `draft`인지 확인 (이미 발행/예약/보관된 초안은 발행 불가)
  2. 해당 사이트의 `wp_credentials`에서 연결 정보 조회
  3. 암호화된 비밀번호를 RPC(`get_wp_decrypted_password`)로 복호화
  4. 워드프레스 REST API(`POST /wp-json/wp/v2/posts`)에 글 생성 요청 (`status: "draft"`)
  5. 성공 시 초안 상태를 `published`로 변경하고 워드프레스 메타데이터 저장
* **발행 데이터:**
  * 워드프레스에 전송: `title`, `content` (HTML), `status`
  * 발행 후 저장: `wp_post_id`, `wp_post_url`, `wp_post_status`, `published_at`
* **UI 피드백:**
  * 발행 전 확인 다이얼로그 표시 ("이 초안을 워드프레스에 발행하시겠습니까?")
  * 발행 중 로딩 인디케이터 표시
  * 성공 시 성공 메시지와 함께 상태 뱃지가 "발행됨"으로 변경
  * 실패 시 에러 메시지 표시 (워드프레스 서버 연결 실패, API 오류 등)
  * 발행된 초안은 발행 버튼이 비활성화되고 "이미 발행된 초안입니다." 메시지 표시
  * 워드프레스 게시글 URL이 "워드프레스에서 보기" 링크로 제공

### 2.5 예약 발행
* **설명:** 초안을 지정된 미래 시점에 워드프레스에 예약 발행합니다.
* **구현 파일:**
  * 프론트엔드: `src/app/(signed)/drafts/[id]/page.tsx`
  * API: `src/app/api/content/[id]/publish/route.ts`
  * 훅: `src/hooks/useDraft.ts` (`publishDraft` 메서드)
* **예약 발행 프로세스:**
  1. 초안 상세 페이지에서 "예약 발행" 버튼을 클릭하면 날짜/시간 선택 UI가 표시됩니다.
  2. `datetime-local` 타입의 입력 필드로 발행 시점을 선택합니다 (현재 시점 이후만 선택 가능).
  3. "예약" 버튼 클릭 시 `POST /api/content/[id]/publish`에 `{ wp_status: "future", scheduled_at: ISO문자열 }` 요청을 전송합니다.
  4. API에서 워드프레스 REST API에 `status: "future"`와 `date: scheduledAt`를 전달합니다.
  5. 성공 시 초안 상태를 `scheduled`로 변경하고 `scheduled_at` 필드에 예약 시각을 저장합니다.
* **API 동작:**
  * `scheduled_at` 파라미터가 요청 본문에 포함되면 `wp_status`를 `"future"`로 설정
  * 워드프레스에 전송하는 페이로드에 `date` 필드 추가 (`scheduledAt` ISO 문자열)
  * DB에 `status: "scheduled"`, `scheduled_at: scheduledAt` 저장
  * 워드프레스 메타데이터 (`wp_post_id`, `wp_post_url`, `wp_post_status`, `published_at`) 동일하게 저장
* **UI 구성:**
  * "즉시 발행" 버튼 아래에 "예약 발행" 버튼 배치
  * 예약 발행 클릭 시 `datetime-local` 입력 필드와 "예약"/"취소" 버튼 표시
  * 최소 선택 가능 시각은 현재 시점 (`getMinDateTime()` 함수로 계산)
  * 예약 완료 시 성공 메시지에 예약 시각 표시
  * 예약된 초안은 상태가 "예약됨"으로 표시되고 발행 버튼이 비활성화됨
  * 사이드바 상태 섹션에 "예약 발행일" 항목 추가 표시

### 2.6 초안 삭제 (보관)
* **설명:** 불필요한 초안을 보관(soft delete) 처리합니다.
* **주요 동작:**
  * `DELETE /api/content/[id]` 호출 시 실제 데이터를 삭제하지 않고 `status: archived`로 변경합니다.
  * 삭제 성공 시 초안 목록 페이지(`/drafts`)로 자동 이동합니다.

---

## 3. 초안 상태 흐름

```
  [생성 완료]
      |
      v
   draft ──── [즉시 발행] ───-> published
      |
      |─── [예약 발행] ───-> scheduled
      |
      |─── [삭제] ───-> archived
```

| 상태 | 설명 | 가능한 액션 |
|------|------|------------|
| `draft` | AI 생성 직후, 검토/편집 가능 | 편집, 즉시 발행, 예약 발행, 삭제 |
| `published` | 워드프레스에 발행 완료 | 조회만 가능 (발행 버튼 비활성화) |
| `scheduled` | 워드프레스에 예약 발행 설정됨 | 조회만 가능 (발행 버튼 비활성화) |
| `archived` | 소프트 삭제됨 | 목록에 표시되지 않음 |

---

## 4. API 명세

| 라우트 | 메서드 | 설명 | 요청 본문 | 응답 |
|---|---|---|---|---|
| `/api/content/[id]/publish` | POST | 초안을 워드프레스에 발행 (즉시 또는 예약) | `{wp_status?: string, scheduled_at?: string}` | 업데이트된 `ContentDraft` |

### 발행 요청 시나리오

| 시나리오 | 요청 본문 | WP 전송 | DB 상태 |
|---------|----------|---------|---------|
| 즉시 발행 | `{ wp_status: "draft" }` | `{ status: "draft" }` | `status: "published"` |
| 예약 발행 | `{ wp_status: "future", scheduled_at: "2026-03-10T09:00:00.000Z" }` | `{ status: "future", date: "2026-03-10T09:00:00.000Z" }` | `status: "scheduled", scheduled_at: "..."` |

### 에러 응답

| HTTP 코드 | 상황 |
|-----------|------|
| 401 | 인증되지 않은 요청 |
| 400 | 이미 발행/예약/보관된 초안 (`status !== "draft"`) |
| 404 | 초안 또는 워드프레스 자격증명 없음 |
| 500 | 비밀번호 복호화 실패 또는 서버 오류 |
| 502 | 워드프레스 서버 연결 실패 |

---

## 5. 엣지 케이스 처리

| 상황 | 처리 방식 |
|---|---|
| 이미 발행된 초안 재발행 시도 | `status !== "draft"` 조건으로 차단, HTTP 400 반환 ("이미 발행되었거나 예약/보관된 초안입니다.") |
| 예약된 초안 재발행 시도 | 동일하게 `status !== "draft"` 조건으로 차단, HTTP 400 반환 |
| 워드프레스 자격증명 삭제 후 발행 시도 | 자격증명 조회 실패 시 HTTP 404 반환 |
| 워드프레스 서버 다운 | fetch 실패 시 HTTP 502 반환 및 에러 메시지 안내 |
| 워드프레스 REST API 인증 실패 | 워드프레스 응답 상태를 그대로 전달 |
| 비밀번호 복호화 실패 | HTTP 500 반환 및 에러 메시지 |
| 보관된 초안 접근 | 목록에서 필터링되어 표시되지 않음 |
| 예약 시각 미입력 후 예약 버튼 클릭 | `scheduledAt`이 비어있으면 요청을 전송하지 않음 (버튼 비활성화) |

---

## 6. 타입 정의

`src/types/content.ts`에 정의된 관련 타입:

```typescript
export type DraftStatus = "draft" | "published" | "scheduled" | "archived";

export interface ContentDraft {
  id: string;
  credential_id: string;
  user_id: string;
  title: string;
  content_html: string;
  topic: string;
  keywords: string[];
  target_length: number;
  internal_links: InternalLink[];
  metadata: {
    model_used?: string;
    tokens_used?: number;
    generation_duration_ms?: number;
    profile_version?: number;
    wp_post_id?: number;
    wp_post_url?: string;
    wp_post_status?: string;
    published_at?: string;
  };
  scheduled_at?: string;
  status: DraftStatus;
  created_at: string;
  updated_at: string;
}
```

---

## 7. 보안 및 정책

* **인증 필수:** 발행 API를 포함한 모든 API에서 사용자 인증을 확인합니다.
* **데이터 접근 격리 (RLS):** `content_drafts` 테이블의 RLS 정책으로 타 사용자의 초안에 접근할 수 없습니다.
* **비밀번호 보안:** 워드프레스 비밀번호는 pgcrypto로 암호화 저장되며, 발행 시에만 서버 측에서 복호화합니다.
* **Basic Auth 전송:** 워드프레스 REST API 호출 시 Base64 인코딩된 Basic Authentication을 사용하며, HTTPS 통신만 허용됩니다.
* **소프트 삭제:** 초안 삭제 시 데이터를 물리적으로 삭제하지 않고 `archived` 상태로 보존합니다.

---

## 8. 구현 상태

| 기능 | 상태 | 구현 파일 |
|------|------|-----------|
| 초안 목록 관리 | 완료 | `src/app/(signed)/drafts/page.tsx` |
| 초안 상세 검토 (2열 레이아웃) | 완료 | `src/app/(signed)/drafts/[id]/page.tsx` |
| 초안 편집 (저장) | 완료 | `src/hooks/useDraft.ts`, `src/app/(signed)/drafts/[id]/page.tsx` |
| 워드프레스 즉시 발행 | 완료 | `src/app/api/content/[id]/publish/route.ts` |
| 예약 발행 (datetime-local + future status) | 완료 | `src/app/(signed)/drafts/[id]/page.tsx`, `src/app/api/content/[id]/publish/route.ts`, `src/hooks/useDraft.ts` |
| 초안 삭제 (보관) | 완료 | `src/app/(signed)/drafts/[id]/page.tsx` |
| DraftStatus 타입에 scheduled 추가 | 완료 | `src/types/content.ts` |
| ContentDraft에 scheduled_at 필드 추가 | 완료 | `src/types/content.ts` |
