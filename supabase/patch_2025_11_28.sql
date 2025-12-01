-- Patch: add 'link' (and 'video') content types and optional passcode for share links

-- 1) content_type enum additions
do $$ begin
  alter type content_type add value 'link';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type content_type add value 'video';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type content_type add value 'audio';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type content_type add value 'file';
exception when duplicate_object then null; end $$;

-- 2) advent_entries additions
alter table if exists public.advent_entries
  add column if not exists link_url text;
alter table if exists public.advent_entries
  drop constraint if exists advent_entries_day_check;
alter table if exists public.advent_entries
  add constraint advent_entries_day_check check (day between 1 and 31);

-- 3) share_links: passcode setter RPC (creator only)
create or replace function public.set_share_link_passcode(p_code text, p_passcode text)
returns public.share_links
language plpgsql
security definer
set search_path = public
as $$
declare sl public.share_links; begin
  select * into sl from public.share_links where code = p_code limit 1;
  if sl.id is null then raise exception 'Invalid link'; end if;

  -- Only creator of the relationship can set
  if not exists (
    select 1 from public.relationship_members m
    where m.relationship_id = sl.relationship_id and m.user_id = auth.uid() and m.role = 'creator'
  ) then
    raise exception 'Not creator';
  end if;

  update public.share_links
     set passcode_hash = case when p_passcode is null or length(p_passcode)=0 then null else extensions.crypt(p_passcode, extensions.gen_salt('bf')) end
   where id = sl.id
   returning * into sl;
  return sl;
end $$;

-- 4) claim_share_link: require passcode if set
drop function if exists public.claim_share_link(text);

create or replace function public.claim_share_link(p_code text, p_passcode text default null)
returns public.share_links
language plpgsql
security definer
set search_path = public
as $$
declare
  sl public.share_links;
begin
  select * into sl from public.share_links where code = p_code and disabled = false limit 1;
  if sl.id is null then raise exception 'Invalid or disabled link'; end if;
  if sl.expires_at is not null and now() >= sl.expires_at then raise exception 'Link expired'; end if;

  if sl.passcode_hash is not null then
    if p_passcode is null or extensions.crypt(p_passcode, sl.passcode_hash) <> sl.passcode_hash then
      raise exception 'Passcode required or invalid';
    end if;
  end if;

  if sl.claimed_by is null then
    update public.share_links
       set claimed_by = auth.uid(), claimed_at = now()
     where id = sl.id
     returning * into sl;
    return sl;
  end if;

  if sl.claimed_by = auth.uid() then return sl; end if;

  raise exception 'This link is already claimed by someone else';
end $$;
