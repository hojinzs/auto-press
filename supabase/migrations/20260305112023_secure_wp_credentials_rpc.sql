-- 비밀번호 암호화 저장을 위한 RPC 함수
create or replace function public.add_wp_credential(
    p_site_name text,
    p_site_url text,
    p_username text,
    p_password text
) returns uuid as $$
declare
    v_new_id uuid;
begin
    insert into public.wp_credentials (
        user_id,
        site_name,
        site_url,
        wp_username,
        wp_app_password
    ) values (
        auth.uid(),
        p_site_name,
        p_site_url,
        p_username,
        -- pgcrypto pgp_sym_encrypt 사용
        -- 실제 환경에서는 'auto-press-secret-key'와 같은 키를 Vault 등에서 관리
        pgp_sym_encrypt(p_password, 'auto-press-secret-key')
    ) returning id into v_new_id;
    
    return v_new_id;
end;
$$ language plpgsql security definer;

-- (선택사항) 암호화된 비밀번호를 복호화하여 가져오는 함수 (서버 사이드에서만 사용 권장)
create or replace function public.get_wp_decrypted_password(p_id uuid)
returns text as $$
begin
    return (
        select pgp_sym_decrypt(wp_app_password::bytea, 'auto-press-secret-key')
        from public.wp_credentials
        where id = p_id and user_id = auth.uid()
    );
end;
$$ language plpgsql security invoker;
