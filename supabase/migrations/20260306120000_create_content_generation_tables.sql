-- 콘텐츠 초안 저장
create table public.content_drafts (
    id uuid default gen_random_uuid() primary key,
    credential_id uuid references public.wp_credentials(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null default '',
    content_html text not null default '',
    topic text not null default '',
    keywords text[] default '{}',
    target_length integer default 1500,
    internal_links jsonb default '[]'::jsonb,
    metadata jsonb default '{}'::jsonb,
    status text not null default 'draft'
        check (status in ('draft', 'published', 'archived')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 생성 작업 상태 관리
create table public.generation_jobs (
    id uuid default gen_random_uuid() primary key,
    draft_id uuid references public.content_drafts(id) on delete set null,
    credential_id uuid references public.wp_credentials(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    status text not null default 'pending'
        check (status in ('pending', 'generating', 'linking', 'completed', 'failed')),
    progress jsonb default '{"step": "pending", "detail": "", "percent": 0}'::jsonb,
    error_message text,
    started_at timestamptz default now(),
    completed_at timestamptz
);

-- RLS 활성화
alter table public.content_drafts enable row level security;
alter table public.generation_jobs enable row level security;

-- content_drafts RLS 정책
create policy "Users can view own content_drafts" on public.content_drafts
    for select using (auth.uid() = user_id);
create policy "Users can insert own content_drafts" on public.content_drafts
    for insert with check (auth.uid() = user_id);
create policy "Users can update own content_drafts" on public.content_drafts
    for update using (auth.uid() = user_id);
create policy "Users can delete own content_drafts" on public.content_drafts
    for delete using (auth.uid() = user_id);

-- generation_jobs RLS 정책
create policy "Users can view own generation_jobs" on public.generation_jobs
    for select using (auth.uid() = user_id);
create policy "Users can insert own generation_jobs" on public.generation_jobs
    for insert with check (auth.uid() = user_id);
create policy "Users can update own generation_jobs" on public.generation_jobs
    for update using (auth.uid() = user_id);

-- generation_jobs를 Realtime publication에 추가
alter publication supabase_realtime add table public.generation_jobs;

-- Edge Function(service_role)에서 호출 가능한 벡터 유사도 검색 RPC
create or replace function public.search_similar_posts_admin(
    query_embedding vector(1536),
    match_threshold float default 0.5,
    match_count int default 5,
    p_credential_id uuid default null,
    p_user_id uuid default null
) returns table (
    post_id uuid,
    chunk_text text,
    similarity float,
    title text,
    permalink text,
    slug text,
    metadata jsonb
) as $$
begin
    return query
    select
        pe.post_id,
        pe.chunk_text,
        1 - (pe.embedding <=> query_embedding) as similarity,
        wp.title,
        wp.permalink,
        wp.slug,
        pe.metadata
    from public.post_embeddings pe
    join public.wp_posts wp on wp.id = pe.post_id
    where (p_user_id is null or pe.user_id = p_user_id)
        and pe.status = 'active'
        and pe.embedding is not null
        and (p_credential_id is null or wp.credential_id = p_credential_id)
        and 1 - (pe.embedding <=> query_embedding) > match_threshold
    order by pe.embedding <=> query_embedding
    limit match_count;
end;
$$ language plpgsql security definer;
