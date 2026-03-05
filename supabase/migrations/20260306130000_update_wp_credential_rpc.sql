-- 워드프레스 자격 증명 수정을 위한 RPC 함수
create or replace function public.update_wp_credential(
    p_id uuid,
    p_site_name text,
    p_wp_password text default null
) returns void as $$
begin
    if p_wp_password is not null and p_wp_password <> '' then
        update public.wp_credentials
        set
            site_name = p_site_name,
            wp_app_password = pgp_sym_encrypt(p_wp_password, 'auto-press-secret-key')
        where id = p_id and user_id = auth.uid();
    else
        update public.wp_credentials
        set site_name = p_site_name
        where id = p_id and user_id = auth.uid();
    end if;
end;
$$ language plpgsql security definer;
