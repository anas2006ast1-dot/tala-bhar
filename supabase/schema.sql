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

-- Public read for everyone (anon + authenticated)
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select using (true);

drop policy if exists "public read menu_items" on public.menu_items;
create policy "public read menu_items" on public.menu_items
  for select using (true);

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings
  for select using (true);

-- Write only for authenticated (admin)
drop policy if exists "auth write categories" on public.categories;
create policy "auth write categories" on public.categories
  for all to authenticated using (true) with check (true);

drop policy if exists "auth write menu_items" on public.menu_items;
create policy "auth write menu_items" on public.menu_items
  for all to authenticated using (true) with check (true);

drop policy if exists "auth write settings" on public.settings;
create policy "auth write settings" on public.settings
  for all to authenticated using (true) with check (true);

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
  for select using (bucket_id = 'menu-images');

drop policy if exists "auth write menu-images" on storage.objects;
create policy "auth write menu-images" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu-images');

drop policy if exists "auth update menu-images" on storage.objects;
create policy "auth update menu-images" on storage.objects
  for update to authenticated using (bucket_id = 'menu-images');

drop policy if exists "auth delete menu-images" on storage.objects;
create policy "auth delete menu-images" on storage.objects
  for delete to authenticated using (bucket_id = 'menu-images');
