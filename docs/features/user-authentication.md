# 기능 명세서: 사용자 인증 및 계정 관리

## 1. 개요
Supabase Auth를 기반으로 플랫폼의 사용자 인증, 회원가입, 세션 관리를 처리하는 핵심 기능입니다. 이메일/비밀번호 인증과 소셜 로그인(OAuth)을 지원하며, Next.js 미들웨어를 통해 인증/비인증 사용자의 라우트 접근을 제어합니다.

---

## 2. 주요 기능

### 2.1 회원가입 (Sign Up)
* **설명:** 신규 사용자가 계정을 생성하고 이메일 인증을 거쳐 플랫폼에 접근할 수 있도록 합니다.
* **입력 항목:**
  * 이름 (Full Name) - 필수
  * 이메일 주소 (Professional Email) - 필수
  * 회사명 (Company Name) - 필수
  * 직책 (Role) - 필수, 선택 목록 제공:
    * Editor-in-Chief
    * Content Marketer
    * SEO Lead
    * Managing Editor
    * Freelance Contributor
  * 비밀번호 - 필수
  * 비밀번호 확인 - 필수
  * 이용약관 및 개인정보처리방침 동의 - 필수
* **주요 동작:**
  * Supabase `auth.signUp()`을 호출하여 계정을 생성합니다.
  * 이름, 회사명, 직책은 `user_metadata`에 저장됩니다.
  * 가입 완료 후 입력된 이메일로 인증 메일을 발송합니다.
  * 이메일 인증 링크 클릭 시 `/auth/callback`으로 리다이렉트되어 세션이 활성화됩니다.
* **유효성 검사:**
  * 비밀번호와 비밀번호 확인 일치 여부 확인
  * 이용약관 동의 여부 확인
  * 모든 필수 항목 입력 확인
* **에러 처리:**
  * 이미 존재하는 이메일로 가입 시도 시 오류 메시지 표시
  * Supabase Auth 에러를 사용자 친화적 메시지로 변환하여 표시

### 2.2 로그인 (Sign In)
* **설명:** 기존 사용자가 이메일/비밀번호 또는 소셜 계정으로 인증하여 플랫폼에 접근합니다.
* **인증 방식:**
  * **이메일/비밀번호:** `supabase.auth.signInWithPassword()` 사용
  * **Google OAuth:** `supabase.auth.signInWithOAuth({ provider: 'google' })` 사용
  * **Apple OAuth:** `supabase.auth.signInWithOAuth({ provider: 'apple' })` 사용
* **주요 동작:**
  * 이메일/비밀번호 로그인 성공 시 대시보드(`/`)로 라우팅하고 서버 컴포넌트를 `router.refresh()`로 갱신합니다.
  * 소셜 로그인 시 해당 OAuth 제공자 페이지로 리다이렉트되며, 인증 후 `/auth/callback`을 거쳐 대시보드로 이동합니다.
  * 비밀번호 입력 필드 옆에 "Forgot?" 링크가 있어 `/forgot-password` 페이지로 이동할 수 있습니다.
* **에러 처리:**
  * 잘못된 자격 증명 입력 시 오류 메시지 표시
  * 비밀번호 표시/숨김 토글 지원

### 2.3 비밀번호 재설정 (Password Reset)
* **설명:** 비밀번호를 잊은 사용자가 이메일을 통해 비밀번호를 재설정할 수 있습니다.
* **경로:**
  * 재설정 요청: `/forgot-password` (`src/app/(unsigned)/forgot-password/page.tsx`)
  * 새 비밀번호 입력: `/reset-password` (`src/app/(unsigned)/reset-password/page.tsx`)
* **프로세스:**
  1. 사용자가 `/forgot-password` 페이지에서 이메일 주소를 입력합니다.
  2. `supabase.auth.resetPasswordForEmail(email, { redirectTo })` 호출로 재설정 링크가 포함된 이메일을 발송합니다.
  3. `redirectTo`는 `${location.origin}/reset-password`로 설정됩니다.
  4. 이메일 발송 성공 시 확인 화면을 표시합니다 (입력된 이메일 주소 및 스팸 폴더 안내 포함).
  5. 사용자가 이메일 링크를 클릭하면 `/reset-password` 페이지로 이동합니다.
  6. `/reset-password` 페이지에서 새 비밀번호와 비밀번호 확인을 입력합니다.
  7. `supabase.auth.updateUser({ password })` 호출로 비밀번호를 변경합니다.
  8. 성공 시 완료 화면을 표시하고 로그인 페이지로 이동할 수 있는 버튼을 제공합니다.
* **유효성 검사:**
  * 비밀번호와 비밀번호 확인 일치 여부 확인
  * 비밀번호 최소 길이 6자 이상
* **UI 구성:**
  * 비밀번호 표시/숨김 토글 지원 (`Eye`/`EyeOff` 아이콘)
  * 각 단계별 상태 전환: 입력 폼 -> 발송 완료 확인 (forgot) / 입력 폼 -> 변경 완료 확인 (reset)
  * "Remember your password?" 텍스트와 로그인 페이지 링크 제공
* **연결 지점:**
  * 로그인 페이지(`/login`)의 비밀번호 필드에 "Forgot?" 링크가 `/forgot-password`로 연결됨

### 2.4 OAuth 콜백 처리
* **설명:** 소셜 로그인 및 이메일 인증 링크 클릭 후 Supabase의 인증 코드를 세션으로 교환합니다.
* **경로:** `GET /auth/callback`
* **주요 동작:**
  * URL 쿼리 파라미터에서 `code`를 추출합니다.
  * `supabase.auth.exchangeCodeForSession(code)`를 호출하여 세션을 생성합니다.
  * 세션 생성 후 대시보드(`/`)로 리다이렉트합니다.

### 2.5 세션 관리 및 라우트 보호
* **설명:** Next.js 미들웨어를 통해 모든 요청에서 세션 상태를 확인하고 쿠키를 갱신합니다.
* **구현 파일:**
  * `src/middleware.ts` - 미들웨어 진입점
  * `src/utils/supabase/middleware.ts` - `updateSession()` 함수 구현
* **주요 동작:**
  * `@supabase/ssr`의 `createServerClient`를 사용하여 서버 측에서 세션을 관리합니다.
  * 모든 페이지 요청 시 `supabase.auth.getUser()`로 현재 사용자를 확인합니다.
  * Supabase 세션 쿠키를 자동으로 갱신하여 세션 만료를 방지합니다.
* **publicPaths 기반 라우트 보호:**
  * `publicPaths` 배열로 비인증 사용자가 접근할 수 있는 경로를 정의합니다:
    * `/login` - 로그인 페이지
    * `/signup` - 회원가입 페이지
    * `/auth/callback` - OAuth 콜백
    * `/forgot-password` - 비밀번호 재설정 요청 페이지
    * `/reset-password` - 새 비밀번호 입력 페이지
  * 비인증 사용자가 `publicPaths`에 포함되지 않은 경로에 접근하면 `/login`으로 리다이렉트합니다.
  * 경로 매칭은 `request.nextUrl.pathname.startsWith(path)` 방식으로 수행됩니다.
* **라우트 그룹:**
  * `(unsigned)`: 비인증 사용자 전용 (`/login`, `/signup`, `/auth/callback`, `/forgot-password`, `/reset-password`)
  * `(signed)`: 인증된 사용자 전용 (대시보드, 초안 관리, 설정 등)
* **미들웨어 적용 범위 (matcher):**
  * 정적 파일(`_next/static`, `_next/image`), 파비콘, 이미지 파일(svg, png, jpg, jpeg, gif, webp)을 제외한 모든 요청
  * matcher 패턴: `/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`

### 2.6 API 라우트 인증
* **설명:** 모든 API 라우트에서 사용자 인증을 의무적으로 확인합니다.
* **주요 동작:**
  * 각 API 핸들러에서 `supabase.auth.getUser()`를 호출하여 인증 상태를 확인합니다.
  * 인증되지 않은 요청에 대해 `401 Unauthorized` 응답을 반환합니다.
  * 인증된 사용자의 `user.id`를 활용하여 RLS 정책을 통한 데이터 접근 격리를 보장합니다.

---

## 3. 대시보드 실시간 데이터

* **설명:** 대시보드 메인 페이지(`/`)가 서버 컴포넌트로 구현되어 Supabase에서 실제 데이터를 실시간으로 조회합니다.
* **구현 파일:** `src/app/(signed)/page.tsx`
* **조회 데이터 (Promise.all로 병렬 조회):**
  * **총 초안 수:** `content_drafts` 테이블의 전체 레코드 수 (`count: "exact"`, `head: true`)
  * **발행 수:** `content_drafts` 테이블에서 `status = "published"` 조건의 레코드 수
  * **연결 사이트 목록:** `wp_credentials` 테이블에서 `id, site_name, site_url, status, created_at` 조회
  * **최근 5개 초안:** `content_drafts` 테이블에서 `id, title, status, topic, keywords, created_at, updated_at` 조회 (생성일 내림차순, 최대 5건)
* **UI 구성:**
  * 상단 통계 카드 3개: TOTAL DRAFTS, PUBLISHED, CONNECTED SITES
  * 좌측: Recent Drafts 목록 (제목, 주제, 생성일, 상태 뱃지 표시)
  * 우측: Connection Health (사이트별 연결 상태), Quick Actions (New Draft, All Drafts, Site Connections)
  * 빈 상태 처리: 초안 없을 시 "New Draft" 버튼 제공, 사이트 없을 시 연동 안내 링크 제공

---

## 4. 사이트 연동 수정

* **설명:** 연동된 워드프레스 사이트의 정보를 인라인 편집 모드로 수정할 수 있습니다.
* **구현 파일:**
  * 프론트엔드: `src/app/(signed)/settings/connections/page.tsx`
  * API: `src/app/api/sites/[id]/route.ts`
* **수정 가능 항목:**
  * 사이트명 (`site_name`) - 필수
  * 워드프레스 비밀번호 (`wp_password`) - 선택 (변경 시에만 입력)
* **인라인 편집 프로세스:**
  1. 사이트 카드의 편집(Pencil) 아이콘 클릭으로 편집 모드 진입
  2. 사이트명 입력 필드와 새 비밀번호 입력 필드(password 타입) 표시
  3. 저장(Check) 아이콘 클릭 시 `PATCH /api/sites/[id]` 호출
  4. 취소(X) 아이콘으로 편집 모드 종료
* **API 엔드포인트:** `PATCH /api/sites/[id]`
  * 요청 본문: `{ site_name: string, wp_password?: string }`
  * `site_name`은 필수 (없으면 400 반환)
  * `wp_password`가 제공되면 함께 전달
  * Supabase RPC `update_wp_credential` 호출 (`p_id`, `p_site_name`, `p_wp_password`)
  * 성공 시 `{ success: true }` 반환

---

## 5. 보안 및 정책

* **JWT 기반 세션:** Supabase Auth에서 발급하는 JWT 토큰으로 사용자를 식별하며, 서버/클라이언트 양측에서 세션을 안전하게 관리합니다.
* **SSR 쿠키 관리:** `@supabase/ssr` 패키지를 통해 서버 사이드 렌더링 환경에서도 쿠키 기반 세션을 안전하게 처리합니다.
* **RLS 연동:** 인증된 사용자의 `auth.uid()`가 모든 RLS 정책의 기준이 되어 타 사용자 데이터 접근을 원천 차단합니다.
* **Edge Function 인증:** 서버 간 통신에서는 `SUPABASE_SERVICE_ROLE_KEY`를 사용하여 인증하며, 이 키는 클라이언트에 노출되지 않습니다.
* **비밀번호 재설정 보안:** Supabase Auth의 내장 이메일 인증 흐름을 사용하며, 재설정 링크는 일회성으로 만료됩니다.

---

## 6. 구현 상태

| 기능 | 상태 | 구현 파일 |
|------|------|-----------|
| 회원가입 | 완료 | `src/app/(unsigned)/signup/page.tsx` |
| 로그인 (이메일/비밀번호 + OAuth) | 완료 | `src/app/(unsigned)/login/page.tsx` |
| OAuth 콜백 처리 | 완료 | `src/app/auth/callback/route.ts` |
| 미들웨어 라우트 보호 (publicPaths) | 완료 | `src/middleware.ts`, `src/utils/supabase/middleware.ts` |
| 비밀번호 재설정 (forgot + reset) | 완료 | `src/app/(unsigned)/forgot-password/page.tsx`, `src/app/(unsigned)/reset-password/page.tsx` |
| 대시보드 실제 데이터 조회 | 완료 | `src/app/(signed)/page.tsx` |
| 사이트 연동 수정 (인라인 편집) | 완료 | `src/app/(signed)/settings/connections/page.tsx`, `src/app/api/sites/[id]/route.ts` |
| API 라우트 인증 | 완료 | 각 API 핸들러에서 `supabase.auth.getUser()` 확인 |
