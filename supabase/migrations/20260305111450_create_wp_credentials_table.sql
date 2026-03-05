-- pgcrypto extension 활성화 (필요시)
create extension if not exists pgcrypto;

-- 워드프레스 연결 정보 저장용 테이블 생성
create table public.wp_credentials (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    site_name text not null,
    site_url text not null,
    wp_username text not null,
    wp_app_password text not null, -- 암호화되어 저장될 필드
    status text default 'active' check (status in ('active', 'error')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 활성화
alter table public.wp_credentials enable row level security;

-- 정책 1: 사용자는 자신의 연결 정보만 조회할 수 있음
create policy "Users can view own wp credentials"
    on public.wp_credentials for select
    using (auth.uid() = user_id);

-- 정책 2: 사용자는 자신의 연결 정보만 추가할 수 있음
create policy "Users can insert own wp credentials"
    on public.wp_credentials for insert
    with check (auth.uid() = user_id);

-- 정책 3: 사용자는 자신의 연결 정보만 수정할 수 있음
create policy "Users can update own wp credentials"
    on public.wp_credentials for update
    using (auth.uid() = user_id);

-- 정책 4: 사용자는 자신의 연결 정보만 삭제할 수 있음
create policy "Users can delete own wp credentials"
    on public.wp_credentials for delete
    using (auth.uid() = user_id);

-- updated_at 트리거 연결 (만약 기존에 moddatetime extension이 없다면 추가)
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on public.wp_credentials
  for each row execute procedure moddatetime (updated_at);
