-- RLS recursion fix and path-based Storage policies

-- Helper functions to avoid recursive RLS on relationship_members
create or replace function public.is_member(p_rel uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.relationship_members m
    where m.relationship_id = p_rel and m.user_id = auth.uid()
  );
end $$;

grant execute on function public.is_member(uuid) to authenticated;

create or replace function public.is_creator(p_rel uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.relationship_members m
    where m.relationship_id = p_rel and m.user_id = auth.uid() and m.role = 'creator'
  );
end $$;

grant execute on function public.is_creator(uuid) to authenticated;

-- relationship_members SELECT policy via function (non-recursive)
drop policy if exists "members select same relationship" on public.relationship_members;
drop policy if exists "members select same relationship (no-recursive)" on public.relationship_members;
create policy "members select same relationship (no-recursive)"
on public.relationship_members for select to authenticated
using (
  user_id = auth.uid() or public.is_member(relationship_members.relationship_id)
);

-- relationships UPDATE policy via function (creator only)
drop policy if exists "relationships update by creator" on public.relationships;
drop policy if exists "relationships update by creator (fn)" on public.relationships;
create policy "relationships update by creator (fn)"
on public.relationships for update to authenticated
using (public.is_creator(relationships.id))
with check (public.is_creator(relationships.id));

-- Storage policies: switch to path-based check
-- The object name pattern is: relationships/{relationship_id}/{day}/filename.ext
-- Existing metadata-based policies are replaced here.
drop policy if exists "storage read by members" on storage.objects;
drop policy if exists "storage insert by members" on storage.objects;
drop policy if exists "storage delete by creator" on storage.objects;
drop policy if exists "storage read by members (path)" on storage.objects;
drop policy if exists "storage insert by members (path)" on storage.objects;
drop policy if exists "storage delete by creator (path)" on storage.objects;

create policy "storage read by members (path)"
on storage.objects for select to authenticated
using (
  bucket_id = 'advent-media'
  and (split_part(name, '/', 1) = 'relationships')
  and public.is_member((split_part(name, '/', 2))::uuid)
);

create policy "storage insert by members (path)"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'advent-media'
  and (split_part(name, '/', 1) = 'relationships')
  and public.is_member((split_part(name, '/', 2))::uuid)
);

create policy "storage delete by creator (path)"
on storage.objects for delete to authenticated
using (
  bucket_id = 'advent-media'
  and (split_part(name, '/', 1) = 'relationships')
  and public.is_creator((split_part(name, '/', 2))::uuid)
);

-- Ask PostgREST to reload the schema after applying
select pg_notify('pgrst','reload schema');
