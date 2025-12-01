-- Keep pgcrypto in the extensions schema for explicit calls to extensions.gen_random_bytes
create extension if not exists pgcrypto with schema extensions;

do $$ begin
  create type member_role as enum ('creator', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_type as enum ('text', 'image', 'youtube', 'link', 'video', 'audio', 'file');
exception when duplicate_object then null; end $$;

create or replace function generate_invite_code(len int default 6)
returns text
language plpgsql
as $$
declare
  code text;
begin
  -- extensions.gen_random_bytes を明示的に呼ぶ（search_pathに依存しない）
  code := upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, len));
  return code;
end $$;

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null default generate_invite_code(6),
  title text,
  total_days int not null default 24,
  background_key text not null default 'background_1',
  style_key text not null default 'box_white',
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
  day int not null check (day between 1 and 31),
  type content_type not null,
  text_content text,
  image_path text,
  youtube_url text,
  link_url text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (relationship_id, day)
);
create index if not exists idx_entries_rel_day on public.advent_entries(relationship_id, day);
alter table public.advent_entries enable row level security;

-- Share links (creator generates a code; receiver claims)
create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  code text not null unique,
  passcode_hash text,
  disabled boolean not null default false,
  expires_at timestamptz,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_share_links_rel on public.share_links(relationship_id);
alter table public.share_links enable row level security;

-- RLS Policies（IF NOT EXISTS が使えない環境向けに duplicate を握りつぶす）
do $$ begin
  create policy "relationships select members"
  on public.relationships for select to authenticated
  using (exists (
    select 1 from public.relationship_members m
    where m.relationship_id = relationships.id and m.user_id = auth.uid()
  ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "relationships insert self creator"
  on public.relationships for insert to authenticated
  with check (created_by = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "members select same relationship"
  on public.relationship_members for select to authenticated
  using (
    user_id = auth.uid() or exists (
      select 1 from public.relationship_members m2
      where m2.relationship_id = relationship_members.relationship_id and m2.user_id = auth.uid()
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "members insert self only"
  on public.relationship_members for insert to authenticated
  with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "members update role by creator"
  on public.relationship_members for update to authenticated
  using (exists (
    select 1 from public.relationship_members m2
    where m2.relationship_id = relationship_members.relationship_id and m2.user_id = auth.uid() and m2.role = 'creator'
  )) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "entries select by members"
  on public.advent_entries for select to authenticated
  using (exists (
    select 1 from public.relationship_members m
    where m.relationship_id = advent_entries.relationship_id and m.user_id = auth.uid()
  ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "entries insert by creator"
  on public.advent_entries for insert to authenticated
  with check (exists (
    select 1 from public.relationship_members m
    where m.relationship_id = advent_entries.relationship_id and m.user_id = auth.uid() and m.role = 'creator'
  ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "entries update by creator"
  on public.advent_entries for update to authenticated
  using (exists (
    select 1 from public.relationship_members m
    where m.relationship_id = advent_entries.relationship_id and m.user_id = auth.uid() and m.role = 'creator'
  )) with check (exists (
    select 1 from public.relationship_members m
    where m.relationship_id = advent_entries.relationship_id and m.user_id = auth.uid() and m.role = 'creator'
  ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "entries delete by creator"
  on public.advent_entries for delete to authenticated
  using (exists (
    select 1 from public.relationship_members m
    where m.relationship_id = advent_entries.relationship_id and m.user_id = auth.uid() and m.role = 'creator'
  ));
exception when duplicate_object then null; end $$;

-- Share links policies (creator can manage; claimer can read own link)
do $$ begin
  create policy "share_links select by creator or claimer"
  on public.share_links for select to authenticated
  using (
    exists (
      select 1 from public.relationship_members m
      where m.relationship_id = share_links.relationship_id and m.user_id = auth.uid()
    ) or share_links.claimed_by = auth.uid()
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "share_links insert by creator"
  on public.share_links for insert to authenticated
  with check (exists (
    select 1 from public.relationship_members m
    where m.relationship_id = share_links.relationship_id and m.user_id = auth.uid() and m.role = 'creator'
  ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "share_links update by creator"
  on public.share_links for update to authenticated
  using (exists (
    select 1 from public.relationship_members m
    where m.relationship_id = share_links.relationship_id and m.user_id = auth.uid() and m.role = 'creator'
  )) with check (exists (
    select 1 from public.relationship_members m
    where m.relationship_id = share_links.relationship_id and m.user_id = auth.uid() and m.role = 'creator'
  ));
exception when duplicate_object then null; end $$;

-- Storage RLS (requires private bucket `advent-media`)
do $$ begin
  create policy "storage read by members"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'advent-media' and exists (
      select 1 from public.relationship_members m
      where m.user_id = auth.uid() and (storage.objects.metadata->>'relationship_id')::uuid = m.relationship_id
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "storage insert by members"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'advent-media' and exists (
      select 1 from public.relationship_members m
      where m.user_id = auth.uid() and (storage.objects.metadata->>'relationship_id')::uuid = m.relationship_id
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "storage delete by creator"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'advent-media' and exists (
      select 1 from public.relationship_members m
      where m.user_id = auth.uid() and m.role = 'creator' and (storage.objects.metadata->>'relationship_id')::uuid = m.relationship_id
    )
  );
exception when duplicate_object then null; end $$;

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

-- Upsert an entry (creator only). Returns the saved row.
create or replace function public.upsert_advent_entry(
  p_relationship uuid,
  p_day int,
  p_type content_type,
  p_text text default null,
  p_image_path text default null,
  p_youtube_url text default null,
  p_link_url text default null
)
returns public.advent_entries
language plpgsql
security definer
set search_path = public
as $$
declare entry public.advent_entries; begin
  if not exists (
    select 1 from public.relationship_members m
    where m.relationship_id = p_relationship and m.user_id = auth.uid() and m.role = 'creator'
  ) then
    raise exception 'Not creator';
  end if;
  if p_day is null or p_day < 1 then
    raise exception 'Invalid day';
  end if;

  insert into public.advent_entries (relationship_id, day, type, text_content, image_path, youtube_url, link_url, created_by)
    values (p_relationship, p_day, p_type, p_text, p_image_path, p_youtube_url, p_link_url, auth.uid())
  on conflict (relationship_id, day) do update
    set type = excluded.type,
        text_content = excluded.text_content,
        image_path = excluded.image_path,
        youtube_url = excluded.youtube_url,
        link_url = excluded.link_url,
        updated_at = now()
  returning * into entry;
  return entry;
end $$;

grant execute on function public.upsert_advent_entry(uuid, int, content_type, text, text, text, text) to authenticated;
