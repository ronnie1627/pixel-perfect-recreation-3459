-- Roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can read their own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Whether the single admin account has been created yet (safe to expose: boolean only)
create or replace function public.admin_exists()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'admin')
$$;
grant execute on function public.admin_exists() to anon, authenticated;

-- First account becomes the admin; any later sign-up is rejected.
create or replace function public.handle_new_user_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.user_roles where role = 'admin') then
    raise exception 'Sign-ups are closed';
  end if;
  insert into public.user_roles (user_id, role) values (new.id, 'admin');
  return new;
end;
$$;

create trigger on_auth_user_created_admin
  after insert on auth.users
  for each row execute function public.handle_new_user_admin();

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  episode integer not null check (episode >= 0),
  name text not null check (char_length(name) between 1 and 200),
  brand text not null default '' check (char_length(brand) <= 120),
  reel_code text not null default '' check (char_length(reel_code) <= 64),
  amazon_url text not null check (char_length(amazon_url) between 1 and 2048),
  published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create index products_created_at_idx on public.products (created_at desc);
create index products_episode_idx on public.products (episode);

create policy "Anyone can read published products" on public.products
  for select to anon, authenticated using (published = true);
create policy "Admin can read all products" on public.products
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admin can insert products" on public.products
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin can update products" on public.products
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin can delete products" on public.products
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
