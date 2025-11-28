-- Supabase schema for Couple Advent (relationship model)
create extension if not exists pgcrypto;

do $$ begin
  create type member_role as enum ('creator', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_type as enum ('text', 'image', 'youtube');
exception when duplicate_object then null; end $$;

create or replace function generate_invite_code(len int default 6)
returns text
language plpgsql
as $$
declare
  code text;
begin
  code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, len));
  return code;
end $$;

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null default generate_invite_code(6),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.relationships enable row level security;

create table if not exists public.relationship_members (
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null default 'creator',
  joined_at timestamptz not null default now(),
  primary key (relationship_id, user_id)
);
create index if not exists idx_members_user on public.relationship_members(user_id);
create index if not exists idx_members_rel on public.relationship_members(relationship_id);
alter table public.relationship_members enable row level security;

create table if not exists public.advent_entries (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  day int not null check (day between 1 and 24),
  type content_type not null,
  text_content text,
  image_path text,
  youtube_url text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (relationship_id, day)
);
create index if not exists idx_entries_rel_day on public.advent_entries(relationship_id, day);
alter table public.advent_entries enable row level security;

-- RLS Policies
create policy if not exists "relationships select members"
on public.relationships for select to authenticated
using (exists (
  select 1 from public.relationship_members m
  where m.relationship_id = relationships.id and m.user_id = auth.uid()
));

create policy if not exists "relationships insert self creator"
on public.relationships for insert to authenticated
with check (created_by = auth.uid());

create policy if not exists "members select same relationship"
on public.relationship_members for select to authenticated
using (
  user_id = auth.uid() or exists (
    select 1 from public.relationship_members m2
    where m2.relationship_id = relationship_members.relationship_id and m2.user_id = auth.uid()
  )
);

create policy if not exists "members insert self only"
on public.relationship_members for insert to authenticated
with check (user_id = auth.uid());

create policy if not exists "members update role by creator"
on public.relationship_members for update to authenticated
using (exists (
  select 1 from public.relationship_members m2
  where m2.relationship_id = relationship_members.relationship_id and m2.user_id = auth.uid() and m2.role = 'creator'
)) with check (true);

create policy if not exists "entries select by members"
on public.advent_entries for select to authenticated
using (exists (
  select 1 from public.relationship_members m
  where m.relationship_id = advent_entries.relationship_id and m.user_id = auth.uid()
));

create policy if not exists "entries insert by creator"
on public.advent_entries for insert to authenticated
with check (exists (
  select 1 from public.relationship_members m
  where m.relationship_id = advent_entries.relationship_id and m.user_id = auth.uid() and m.role = 'creator'
));

create policy if not exists "entries update by creator"
on public.advent_entries for update to authenticated
using (exists (
  select 1 from public.relationship_members m
  where m.relationship_id = advent_entries.relationship_id and m.user_id = auth.uid() and m.role = 'creator'
)) with check (exists (
  select 1 from public.relationship_members m
  where m.relationship_id = advent_entries.relationship_id and m.user_id = auth.uid() and m.role = 'creator'
));

create policy if not exists "entries delete by creator"
on public.advent_entries for delete to authenticated
using (exists (
  select 1 from public.relationship_members m
  where m.relationship_id = advent_entries.relationship_id and m.user_id = auth.uid() and m.role = 'creator'
));

-- Storage RLS (requires private bucket `advent-media`)
create policy if not exists "storage read by members"
on storage.objects for select to authenticated
using (
  bucket_id = 'advent-media' and exists (
    select 1 from public.relationship_members m
    where m.user_id = auth.uid() and (storage.objects.metadata->>'relationship_id')::uuid = m.relationship_id
  )
);

create policy if not exists "storage insert by members"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'advent-media' and exists (
    select 1 from public.relationship_members m
    where m.user_id = auth.uid() and (storage.objects.metadata->>'relationship_id')::uuid = m.relationship_id
  )
);

create policy if not exists "storage delete by creator"
on storage.objects for delete to authenticated
using (
  bucket_id = 'advent-media' and exists (
    select 1 from public.relationship_members m
    where m.user_id = auth.uid() and m.role = 'creator' and (storage.objects.metadata->>'relationship_id')::uuid = m.relationship_id
  )
);

-- RPC helpers
create or replace function public.create_relationship_and_join()
returns public.relationships language plpgsql security definer as $$
declare rel public.relationships; begin
  insert into public.relationships (created_by) values (auth.uid()) returning * into rel;
  insert into public.relationship_members (relationship_id, user_id, role) values (rel.id, auth.uid(), 'creator') on conflict do nothing;
  return rel;
end $$;

create or replace function public.join_relationship_by_code(p_code text)
returns public.relationships language plpgsql security definer as $$
declare rel public.relationships; member_count int; begin
  select * into rel from public.relationships where invite_code = p_code limit 1;
  if rel.id is null then raise exception 'Invalid invite code'; end if;
  select count(*) into member_count from public.relationship_members where relationship_id = rel.id;
  if member_count >= 2 then raise exception 'This relationship already has two members'; end if;
  insert into public.relationship_members (relationship_id, user_id, role) values (rel.id, auth.uid(), 'viewer') on conflict do nothing;
  return rel;
end $$;

