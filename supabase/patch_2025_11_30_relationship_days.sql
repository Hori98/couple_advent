-- Ensure relationships has title and total_days, and provide a single RPC to create with both.

alter table if exists public.relationships
  add column if not exists title text,
  add column if not exists total_days int not null default 24;

-- Creator-only update policy already added via is_creator(); no change here.

create or replace function public.create_relationship_with_days(p_title text, p_total_days int)
returns public.relationships
language plpgsql
security definer
set search_path = public
as $$
declare rel public.relationships; begin
  if p_total_days is null or p_total_days < 1 then
    p_total_days := 24;
  end if;
  insert into public.relationships (created_by, title, total_days)
  values (auth.uid(), p_title, p_total_days)
  returning * into rel;
  insert into public.relationship_members (relationship_id, user_id, role)
  values (rel.id, auth.uid(), 'creator')
  on conflict do nothing;
  return rel;
end $$;

grant execute on function public.create_relationship_with_days(text, int) to authenticated;

select pg_notify('pgrst','reload schema');

