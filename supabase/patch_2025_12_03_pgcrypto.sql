-- Ensure pgcrypto is available and invite_code generator works without search_path issues

create extension if not exists pgcrypto with schema extensions;

create or replace function public.generate_invite_code(len int default 6)
returns text
language plpgsql
as $$
declare
  code text;
begin
  code := upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, len));
  return code;
end $$;

select pg_notify('pgrst','reload schema');
