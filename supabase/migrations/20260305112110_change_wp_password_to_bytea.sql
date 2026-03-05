-- wp_credentials 테이블의 비밀번호 필드 타입을 bytea로 변경
alter table public.wp_credentials 
alter column wp_app_password drop default,
alter column wp_app_password type bytea using wp_app_password::bytea;

-- RPC 함수 업데이트 (bytea를 명시적으로 처리)
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
        pgp_sym_encrypt(p_password, 'auto-press-secret-key')
    ) returning id into v_new_id;
    
    return v_new_id;
end;
$$ language plpgsql security definer;
