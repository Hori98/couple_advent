-- Ensure relationships has title/total_days/design and provide a single RPC to create with all.

alter table if exists public.relationships
  add column if not exists title text,
  add column if not exists total_days int not null default 24,
  add column if not exists background_key text not null default 'background_1',
  add column if not exists style_key text not null default 'box_white';

-- Creator-only update policy already added via is_creator(); no change here.

create or replace function public.create_relationship_with_days(
  p_title text,
  p_total_days int,
  p_background_key text default 'background_1',
  p_style_key text default 'box_white'
)
returns public.relationships
language plpgsql
security definer
set search_path = public
as $$
declare rel public.relationships; begin
  p_total_days := coalesce(p_total_days, 24);
  if p_total_days < 1 then p_total_days := 24; end if;
  if p_total_days > 31 then p_total_days := 31; end if;
  insert into public.relationships (created_by, title, total_days, background_key, style_key)
  values (auth.uid(), p_title, p_total_days, coalesce(p_background_key, 'background_1'), coalesce(p_style_key, 'box_white'))
  returning * into rel;
  insert into public.relationship_members (relationship_id, user_id, role)
  values (rel.id, auth.uid(), 'creator')
  on conflict do nothing;
  return rel;
end $$;

grant execute on function public.create_relationship_with_days(text, int, text, text) to authenticated;

select pg_notify('pgrst','reload schema');
