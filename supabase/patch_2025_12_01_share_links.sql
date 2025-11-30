-- Fix share link creation to use gen_random_bytes (not gen_random_byte) and expose RPC

create or replace function public.create_share_link(p_relationship uuid)
returns public.share_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  sl public.share_links;
begin
  if not public.is_creator(p_relationship) then
    raise exception 'Not creator';
  end if;

  -- generate unique short code
  loop
    v_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8));
    exit when not exists (select 1 from public.share_links where code = v_code);
  end loop;

  insert into public.share_links (relationship_id, code, disabled)
  values (p_relationship, v_code, false)
  returning * into sl;

  return sl;
end $$;

grant execute on function public.create_share_link(uuid) to authenticated;

select pg_notify('pgrst','reload schema');

