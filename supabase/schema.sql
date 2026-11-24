-- ============================================================
--  طلة بحر — Digital Menu Database Schema
--  Run this in Supabase SQL Editor
-- ============================================================

-- Extensions ----------------------------------------------------
create extension if not exists "pgcrypto";

-- 1) Categories -------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name_ar     text not null,
  name_en     text,
  icon        text,                       -- optional emoji/icon key
  sort_order  int  not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 2) Menu items -------------------------------------------------
create table if not exists public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references public.categories(id) on delete cascade,
  name_ar       text not null,
  name_en       text,
  description_ar text,
  price         numeric(10,2) not null default 0,
  image_url     text,
  is_available  boolean not null default true,
  is_featured   boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_menu_items_category on public.menu_items(category_id);
create index if not exists idx_menu_items_sort     on public.menu_items(sort_order);

-- 3) Restaurant settings (single row) --------------------------
create table if not exists public.settings (
  id            int primary key default 1,
  name_ar       text not null default 'طلة بحر',
  name_en       text default 'Talat Bahr',
  tagline_ar    text default 'مأكولات بحرية طازجة',
  currency      text default '₪',
  logo_url      text,
  phone         text,
  instagram     text,
  whatsapp      text,
  constraint settings_singleton check (id = 1)
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ============================================================
--  Row Level Security
-- ============================================================
alter table public.categories  enable row level security;
alter table public.menu_items  enable row level security;
alter table public.settings    enable row level security;
grant select on public.categories, public.menu_items, public.settings to anon, authenticated;
grant insert, update, delete on public.categories, public.menu_items, public.settings to authenticated;

-- Public menu reads; writes are restricted to a server-assigned Auth role.
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "public read menu_items" on public.menu_items;
create policy "public read menu_items" on public.menu_items
  for select to anon, authenticated using (true);

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings
  for select to anon, authenticated using (true);

-- Never authorize writes just because a user is authenticated. The admin role
-- must be assigned in app_metadata by a trusted server-side admin operation.
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
drop policy if exists "restrict writes categories to admin" on public.categories;
drop policy if exists "restrict updates categories to admin" on public.categories;
drop policy if exists "restrict deletes categories to admin" on public.categories;
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
drop policy if exists "restrict writes menu_items to admin" on public.menu_items;
drop policy if exists "restrict updates menu_items to admin" on public.menu_items;
drop policy if exists "restrict deletes menu_items to admin" on public.menu_items;
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
drop policy if exists "restrict writes settings to admin" on public.settings;
drop policy if exists "restrict updates settings to admin" on public.settings;
drop policy if exists "restrict deletes settings to admin" on public.settings;
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

-- ============================================================
--  Realtime
-- ============================================================
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.menu_items;
alter publication supabase_realtime add table public.settings;

-- ============================================================
--  Storage bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

-- Storage policies: public read, authenticated write
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
drop policy if exists "restrict menu-images inserts to admin" on storage.objects;
drop policy if exists "restrict menu-images updates to admin" on storage.objects;
drop policy if exists "restrict menu-images deletes to admin" on storage.objects;
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
