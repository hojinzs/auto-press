-- pgvector 확장 활성화
create extension if not exists vector;

-- 수집된 워드프레스 게시글 저장
create table public.wp_posts (
    id uuid default gen_random_uuid() primary key,
    credential_id uuid references public.wp_credentials(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    wp_post_id bigint not null,
    title text not null,
    content text not null,
    slug text,
    permalink text,
    categories jsonb default '[]'::jsonb,
    tags jsonb default '[]'::jsonb,
    published_at timestamptz,
    collected_at timestamptz default now(),
    unique(credential_id, wp_post_id)
);

-- 벡터 임베딩 저장
create table public.post_embeddings (
    id uuid default gen_random_uuid() primary key,
    post_id uuid references public.wp_posts(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    chunk_index integer not null,
    chunk_text text not null,
    embedding vector(1536),
    metadata jsonb default '{}'::jsonb,
    status text default 'active' check (status in ('active', 'failed', 'pending')),
    created_at timestamptz default now()
);

-- HNSW 인덱스 (cosine similarity 검색 최적화)
create index post_embeddings_embedding_idx on public.post_embeddings
    using hnsw (embedding vector_cosine_ops);

-- 사이트 프로파일 저장
create table public.site_profiles (
    id uuid default gen_random_uuid() primary key,
    credential_id uuid references public.wp_credentials(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    profile_data jsonb not null default '{}'::jsonb,
    version integer not null default 1,
    created_at timestamptz default now()
);

-- 수집 작업 상태 관리
create table public.collection_jobs (
    id uuid default gen_random_uuid() primary key,
    credential_id uuid references public.wp_credentials(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    status text not null default 'pending'
        check (status in ('pending', 'collecting', 'embedding', 'profiling', 'completed', 'failed')),
    total_posts integer default 0,
    collected_posts integer default 0,
    embedded_posts integer default 0,
    error_message text,
    started_at timestamptz default now(),
    completed_at timestamptz
);

-- RLS 활성화
alter table public.wp_posts enable row level security;
alter table public.post_embeddings enable row level security;
alter table public.site_profiles enable row level security;
alter table public.collection_jobs enable row level security;

-- wp_posts RLS 정책
create policy "Users can view own wp_posts" on public.wp_posts
    for select using (auth.uid() = user_id);
create policy "Users can insert own wp_posts" on public.wp_posts
    for insert with check (auth.uid() = user_id);
create policy "Users can update own wp_posts" on public.wp_posts
    for update using (auth.uid() = user_id);
create policy "Users can delete own wp_posts" on public.wp_posts
    for delete using (auth.uid() = user_id);

-- post_embeddings RLS 정책
create policy "Users can view own post_embeddings" on public.post_embeddings
    for select using (auth.uid() = user_id);
create policy "Users can insert own post_embeddings" on public.post_embeddings
    for insert with check (auth.uid() = user_id);
create policy "Users can update own post_embeddings" on public.post_embeddings
    for update using (auth.uid() = user_id);
create policy "Users can delete own post_embeddings" on public.post_embeddings
    for delete using (auth.uid() = user_id);

-- site_profiles RLS 정책
create policy "Users can view own site_profiles" on public.site_profiles
    for select using (auth.uid() = user_id);
create policy "Users can insert own site_profiles" on public.site_profiles
    for insert with check (auth.uid() = user_id);
create policy "Users can update own site_profiles" on public.site_profiles
    for update using (auth.uid() = user_id);
create policy "Users can delete own site_profiles" on public.site_profiles
    for delete using (auth.uid() = user_id);

-- collection_jobs RLS 정책
create policy "Users can view own collection_jobs" on public.collection_jobs
    for select using (auth.uid() = user_id);
create policy "Users can insert own collection_jobs" on public.collection_jobs
    for insert with check (auth.uid() = user_id);
create policy "Users can update own collection_jobs" on public.collection_jobs
    for update using (auth.uid() = user_id);

-- service_role용: Edge Function에서 복호화된 자격증명 조회
create or replace function public.get_wp_credential_for_collection(
    p_credential_id uuid,
    p_user_id uuid
) returns json as $$
begin
    return (
        select json_build_object(
            'id', id,
            'site_url', site_url,
            'wp_username', wp_username,
            'wp_app_password', pgp_sym_decrypt(wp_app_password, 'auto-press-secret-key')
        )
        from public.wp_credentials
        where id = p_credential_id and user_id = p_user_id
    );
end;
$$ language plpgsql security definer;

-- 벡터 유사도 검색 RPC 함수
create or replace function public.search_similar_posts(
    query_embedding vector(1536),
    match_threshold float default 0.5,
    match_count int default 5,
    p_credential_id uuid default null
) returns table (
    post_id uuid,
    chunk_text text,
    similarity float,
    title text,
    permalink text,
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
        pe.metadata
    from public.post_embeddings pe
    join public.wp_posts wp on wp.id = pe.post_id
    where pe.user_id = auth.uid()
        and pe.status = 'active'
        and pe.embedding is not null
        and (p_credential_id is null or wp.credential_id = p_credential_id)
        and 1 - (pe.embedding <=> query_embedding) > match_threshold
    order by pe.embedding <=> query_embedding
    limit match_count;
end;
$$ language plpgsql security invoker;

-- collection_jobs를 Realtime publication에 추가
alter publication supabase_realtime add table public.collection_jobs;
