-- Open events logging (receiver opens a day). Preview mode should not call this RPC.

create table if not exists public.open_events (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  day int not null,
  opened_by uuid not null references auth.users(id) on delete cascade,
  opened_at timestamptz not null default now(),
  unique (relationship_id, day, opened_by)
);
alter table public.open_events enable row level security;

-- Helper to allow creator or claimed receiver to log
create or replace function public.can_view_relationship(p_rel uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.relationship_members m
    where m.relationship_id = p_rel and m.user_id = auth.uid()
  ) then return true; end if;
  if exists (
    select 1 from public.share_links s
    where s.relationship_id = p_rel
      and s.claimed_by = auth.uid()
      and s.disabled = false
      and (s.expires_at is null or now() < s.expires_at)
  ) then return true; end if;
  return false;
end $$;

grant execute on function public.can_view_relationship(uuid) to authenticated;

create policy if not exists "open_events select by viewer"
on public.open_events for select to authenticated
using (public.can_view_relationship(open_events.relationship_id));

create policy if not exists "open_events insert by viewer"
on public.open_events for insert to authenticated
with check (public.can_view_relationship(open_events.relationship_id));

-- RPC to log an open event (idempotent per user/day)
create or replace function public.log_open_event(p_relationship uuid, p_day int)
returns public.open_events
language plpgsql security definer set search_path = public as $$
declare ev public.open_events; begin
  if not public.can_view_relationship(p_relationship) then
    raise exception 'not allowed';
  end if;
  insert into public.open_events (relationship_id, day, opened_by)
    values (p_relationship, p_day, auth.uid())
  on conflict (relationship_id, day, opened_by) do update
    set opened_at = now()
  returning * into ev;
  return ev;
end $$;

grant execute on function public.log_open_event(uuid, int) to authenticated;

select pg_notify('pgrst','reload schema');

