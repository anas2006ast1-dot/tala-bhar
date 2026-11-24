-- REVIEW DRAFT ONLY. Never run this file from the browser or before the
-- Auth-aware app is prepared. No Supabase changes have been made by Codex.
--
-- Public menu reads remain available. Table writes and menu-image mutations
-- require the server-managed JWT claim app_metadata.role = 'admin'.
-- Restrictive policies also prevent any other permissive policy from granting
-- non-admin writes to these tables or to this bucket.

begin;

alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.settings enable row level security;
alter table storage.objects enable row level security;

-- SQL privileges permit requests to reach RLS; they do not grant access by
-- themselves. Restrictive policies below still decide which writes succeed.
grant select on public.categories, public.menu_items, public.settings to anon, authenticated;
grant insert, update, delete on public.categories, public.menu_items, public.settings to authenticated;

-- Preserve public reads for the customer menu.
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "public read menu_items" on public.menu_items;
create policy "public read menu_items" on public.menu_items
  for select to anon, authenticated using (true);

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings
  for select to anon, authenticated using (true);

-- Remove the broad policies defined by the old schema and the first review draft.
drop policy if exists "auth write categories" on public.categories;
drop policy if exists "admin manage categories" on public.categories;
drop policy if exists "admin insert categories" on public.categories;
drop policy if exists "admin update categories" on public.categories;
drop policy if exists "admin delete categories" on public.categories;

create policy "admin insert categories" on public.categories
  for insert to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admin update categories" on public.categories
  for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admin delete categories" on public.categories
  for delete to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "restrict writes categories to admin" on public.categories
  as restrictive for insert to public
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "restrict updates categories to admin" on public.categories
  as restrictive for update to public
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "restrict deletes categories to admin" on public.categories
  as restrictive for delete to public
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "auth write menu_items" on public.menu_items;
drop policy if exists "admin manage menu_items" on public.menu_items;
drop policy if exists "admin insert menu_items" on public.menu_items;
drop policy if exists "admin update menu_items" on public.menu_items;
drop policy if exists "admin delete menu_items" on public.menu_items;

create policy "admin insert menu_items" on public.menu_items
  for insert to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admin update menu_items" on public.menu_items
  for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admin delete menu_items" on public.menu_items
  for delete to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "restrict writes menu_items to admin" on public.menu_items
  as restrictive for insert to public
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "restrict updates menu_items to admin" on public.menu_items
  as restrictive for update to public
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "restrict deletes menu_items to admin" on public.menu_items
  as restrictive for delete to public
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "auth write settings" on public.settings;
drop policy if exists "admin manage settings" on public.settings;
drop policy if exists "admin insert settings" on public.settings;
drop policy if exists "admin update settings" on public.settings;
drop policy if exists "admin delete settings" on public.settings;

create policy "admin insert settings" on public.settings
  for insert to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admin update settings" on public.settings
  for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admin delete settings" on public.settings
  for delete to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "restrict writes settings to admin" on public.settings
  as restrictive for insert to public
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "restrict updates settings to admin" on public.settings
  as restrictive for update to public
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "restrict deletes settings to admin" on public.settings
  as restrictive for delete to public
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Public bucket downloads remain available. Mutating only menu-images is
-- admin-only; the restrictive predicates leave other buckets unaffected.
drop policy if exists "public read menu-images" on storage.objects;
create policy "public read menu-images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'menu-images');

drop policy if exists "auth write menu-images" on storage.objects;
drop policy if exists "auth update menu-images" on storage.objects;
drop policy if exists "auth delete menu-images" on storage.objects;
drop policy if exists "admin manage menu-images" on storage.objects;
drop policy if exists "admin upload menu-images" on storage.objects;
drop policy if exists "admin update menu-images" on storage.objects;
drop policy if exists "admin delete menu-images" on storage.objects;
drop policy if exists "restrict menu-images inserts to admin" on storage.objects;
drop policy if exists "restrict menu-images updates to admin" on storage.objects;
drop policy if exists "restrict menu-images deletes to admin" on storage.objects;

create policy "admin upload menu-images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'menu-images'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
create policy "admin update menu-images" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'menu-images'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    bucket_id = 'menu-images'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
create policy "admin delete menu-images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'menu-images'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "restrict menu-images inserts to admin" on storage.objects
  as restrictive for insert to public
  with check (
    bucket_id <> 'menu-images'
    or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
create policy "restrict menu-images updates to admin" on storage.objects
  as restrictive for update to public
  using (
    bucket_id <> 'menu-images'
    or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    bucket_id <> 'menu-images'
    or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
create policy "restrict menu-images deletes to admin" on storage.objects
  as restrictive for delete to public
  using (
    bucket_id <> 'menu-images'
    or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

commit;
