-- Products: two-level category + optional ASINs (additive; existing rows land in "Uncategorised")
alter table public.products
  add column if not exists main_category text not null default 'Uncategorised',
  add column if not exists category text not null default '',
  add column if not exists asin_us text,
  add column if not exists asin_in text;
alter table public.products
  add constraint products_asin_us_format check (asin_us is null or asin_us ~ '^[A-Z0-9]{10}$'),
  add constraint products_asin_in_format check (asin_in is null or asin_in ~ '^[A-Z0-9]{10}$'),
  add constraint products_main_category_len check (char_length(main_category) between 1 and 60),
  add constraint products_category_len check (char_length(category) <= 60);
create unique index if not exists products_episode_unique on public.products (episode);
create index if not exists products_category_idx on public.products (main_category, category);

-- Categories: a row with name = '' is the main category itself; other rows are its subcategories.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  main_category text not null check (char_length(main_category) between 1 and 60),
  name text not null default '' check (char_length(name) <= 60),
  sort_order integer not null default 0,
  image_url text check (image_url is null or (image_url ~* '^https?://' and char_length(image_url) <= 2048)),
  emoji text not null default '' check (char_length(emoji) <= 16),
  show_on_home boolean not null default false,
  created_at timestamptz not null default now(),
  unique (main_category, name)
);
comment on column public.categories.name is 'Subcategory name; empty string marks the main-category row.';
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Anyone can read categories" on public.categories
  for select to anon, authenticated using (true);
create policy "Admin can insert categories" on public.categories
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin can update categories" on public.categories
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin can delete categories" on public.categories
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Renaming a category carries its products (and subcategories) along.
create or replace function public.categories_cascade_rename()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.name = '' and new.main_category <> old.main_category then
    update public.categories set main_category = new.main_category
      where main_category = old.main_category and name <> '';
    update public.products set main_category = new.main_category
      where main_category = old.main_category;
  elsif old.name <> '' and old.main_category = new.main_category and new.name <> old.name then
    update public.products set category = new.name
      where main_category = old.main_category and category = old.name;
  end if;
  return new;
end;
$$;
create trigger categories_cascade_rename
  after update on public.categories
  for each row execute function public.categories_cascade_rename();

-- A category that still has products (or subcategories) can't be deleted.
create or replace function public.categories_guard_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.name = '' then
    if old.main_category = 'Uncategorised' then
      raise exception 'The Uncategorised category can''t be deleted';
    end if;
    if exists (select 1 from public.categories where main_category = old.main_category and name <> '') then
      raise exception 'Delete or move its subcategories first';
    end if;
    if exists (select 1 from public.products where main_category = old.main_category) then
      raise exception 'Move its products to another category first';
    end if;
  elsif exists (select 1 from public.products where main_category = old.main_category and category = old.name) then
    raise exception 'Move its products to another category first';
  end if;
  return old;
end;
$$;
create trigger categories_guard_delete
  before delete on public.categories
  for each row execute function public.categories_guard_delete();

insert into public.categories (main_category, name, sort_order, emoji, show_on_home) values
  ('Home & Kitchen', '', 10, '🏠', true),
  ('Home & Kitchen', 'Kitchen gadgets', 1, '🍳', false),
  ('Home & Kitchen', 'Cleaning', 2, '🧽', false),
  ('Home & Kitchen', 'Storage & organisers', 3, '🗄️', false),
  ('Home & Kitchen', 'Home decor', 4, '🪴', false),
  ('Home & Kitchen', 'Lighting', 5, '💡', false),
  ('Tech & Gadgets', '', 20, '🎧', true),
  ('Tech & Gadgets', 'Earbuds & audio', 1, '🎧', false),
  ('Tech & Gadgets', 'Phone accessories', 2, '📱', false),
  ('Tech & Gadgets', 'Smart home', 3, '🏡', false),
  ('Tech & Gadgets', 'Chargers & cables', 4, '🔌', false),
  ('Tech & Gadgets', 'Computer accessories', 5, '💻', false),
  ('Tools & DIY', '', 30, '🔧', true),
  ('Tools & DIY', 'Hand tools', 1, '🔨', false),
  ('Tools & DIY', 'Power tools', 2, '🪚', false),
  ('Tools & DIY', 'Car care', 3, '🚗', false),
  ('Tools & DIY', 'Repair', 4, '🛠️', false),
  ('Travel & Outdoors', '', 40, '🧳', true),
  ('Travel & Outdoors', 'Travel gear', 1, '🧳', false),
  ('Travel & Outdoors', 'Camping', 2, '⛺', false),
  ('Travel & Outdoors', 'Bags & backpacks', 3, '🎒', false),
  ('Health & Fitness', '', 50, '💪', true),
  ('Health & Fitness', 'Fitness gear', 1, '🏋️', false),
  ('Health & Fitness', 'Wellness', 2, '🧘', false),
  ('Health & Fitness', 'Personal care', 3, '🧴', false),
  ('Fashion & Accessories', '', 60, '🕶️', true),
  ('Fashion & Accessories', 'Watches', 1, '⌚', false),
  ('Fashion & Accessories', 'Sunglasses', 2, '🕶️', false),
  ('Fashion & Accessories', 'Wallets', 3, '👛', false),
  ('Fashion & Accessories', 'Everyday wear', 4, '👕', false),
  ('Kids, Pets & Gifts', '', 70, '🎁', true),
  ('Kids, Pets & Gifts', 'Kids', 1, '🧸', false),
  ('Kids, Pets & Gifts', 'Pets', 2, '🐾', false),
  ('Kids, Pets & Gifts', 'Gift ideas', 3, '🎁', false),
  ('Kids, Pets & Gifts', 'Seasonal', 4, '🎄', false),
  ('Uncategorised', '', 1000, '📦', false)
on conflict (main_category, name) do nothing;

-- Banners for the home carousel (image is a pasted link, never uploaded).
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null default '' check (char_length(image_url) <= 2048 and (image_url = '' or image_url ~* '^https?://')),
  title text not null default '' check (char_length(title) <= 80),
  subtitle text not null default '' check (char_length(subtitle) <= 160),
  button_text text not null default '' check (char_length(button_text) <= 40),
  link text not null default '' check (char_length(link) <= 300 and (link = '' or (link ~ '^/' and link !~ '^//'))),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.banners to anon, authenticated;
grant insert, update, delete on public.banners to authenticated;
grant all on public.banners to service_role;
alter table public.banners enable row level security;
create policy "Anyone can read active banners" on public.banners
  for select to anon, authenticated using (active = true);
create policy "Admin can read all banners" on public.banners
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admin can insert banners" on public.banners
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin can update banners" on public.banners
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin can delete banners" on public.banners
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Site settings: public read, admin write.
create table public.settings (
  key text primary key check (key in ('us_tag', 'in_tag', 'announcement_text', 'instagram_url')),
  value text not null default '' check (char_length(value) <= 500),
  updated_at timestamptz not null default now()
);
grant select on public.settings to anon, authenticated;
grant insert, update, delete on public.settings to authenticated;
grant all on public.settings to service_role;
alter table public.settings enable row level security;
create policy "Anyone can read settings" on public.settings
  for select to anon, authenticated using (true);
create policy "Admin can insert settings" on public.settings
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin can update settings" on public.settings
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin can delete settings" on public.settings
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

insert into public.settings (key, value) values
  ('us_tag', ''),
  ('in_tag', ''),
  ('announcement_text', 'New product tested every day · Shop on Amazon in your country'),
  ('instagram_url', '')
on conflict (key) do nothing;