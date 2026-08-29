create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('user', 'photographer_pending', 'photographer', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photographer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  name text not null,
  identity text not null,
  bio text not null default '',
  familiar_routes text[] not null default '{}',
  familiar_spots text[] not null default '{}',
  styles text[] not null default '{}',
  seasons text[] not null default '{}',
  mutual_status text not null default '可互勉',
  contact_authorized boolean not null default false,
  contact_wechat text,
  contact_email text,
  contact_qq text,
  representative_image_urls text[] not null default '{}',
  portfolio_note text,
  rights_confirmed boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'needs_revision', 'rejected')),
  review_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.spot_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  spot_name text not null,
  location_description text not null,
  latitude numeric,
  longitude numeric,
  recommended_time text,
  sun_direction text,
  focal_length text,
  seasons text[] not null default '{}',
  crowd_level text,
  shooting_tips text,
  image_urls text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'needs_revision', 'rejected')),
  review_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  photographer_profile_id uuid references public.photographer_profiles(id) on delete set null,
  title text,
  photographer_name text,
  spot_slug text,
  route_slug text,
  season text,
  style_tags text[] not null default '{}',
  image_urls text[] not null default '{}',
  description text,
  rights_confirmed boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'needs_revision', 'rejected')),
  review_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.photographer_profiles
  add column if not exists representative_image_urls text[] not null default '{}',
  add column if not exists portfolio_note text,
  add column if not exists rights_confirmed boolean not null default false;

alter table public.work_submissions
  add column if not exists rights_confirmed boolean not null default false;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'photographer_pending', 'photographer', 'admin'));

create table if not exists public.review_logs (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('spot', 'work', 'photographer')),
  target_id uuid not null,
  action text not null check (action in ('approve', 'reject', 'request_revision')),
  note text,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists photographer_profiles_set_updated_at on public.photographer_profiles;
create trigger photographer_profiles_set_updated_at
before update on public.photographer_profiles
for each row execute function public.set_updated_at();

drop trigger if exists spot_submissions_set_updated_at on public.spot_submissions;
create trigger spot_submissions_set_updated_at
before update on public.spot_submissions
for each row execute function public.set_updated_at();

drop trigger if exists work_submissions_set_updated_at on public.work_submissions;
create trigger work_submissions_set_updated_at
before update on public.work_submissions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data ->> 'requested_role' = 'photographer_pending' then 'photographer_pending'
      else 'user'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'user');
$$;

grant execute on function public.current_user_role() to anon, authenticated;

create or replace function public.request_photographer_role()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set role = 'photographer_pending'
  where id = auth.uid()
    and role in ('user', 'photographer_pending');
end;
$$;

grant execute on function public.request_photographer_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.photographer_profiles enable row level security;
alter table public.spot_submissions enable row level security;
alter table public.work_submissions enable row level security;
alter table public.review_logs enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.photographer_profiles, public.spot_submissions, public.work_submissions to anon, authenticated;
grant select, insert, update on public.profiles, public.photographer_profiles, public.spot_submissions, public.work_submissions to authenticated;
grant select, insert on public.review_logs to authenticated;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles
for select
using (id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "profiles update own or admin" on public.profiles;
create policy "profiles update own or admin" on public.profiles
for update
using (id = auth.uid() or public.current_user_role() = 'admin')
with check (
  public.current_user_role() = 'admin'
  or (
    id = auth.uid()
    and role in (public.current_user_role(), 'photographer_pending')
    and public.current_user_role() in ('user', 'photographer_pending', 'photographer')
  )
);

drop policy if exists "photographer profiles public approved" on public.photographer_profiles;
create policy "photographer profiles public approved" on public.photographer_profiles
for select
using (status = 'approved' or user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "photographer profiles owner insert" on public.photographer_profiles;
create policy "photographer profiles owner insert" on public.photographer_profiles
for insert
with check (user_id = auth.uid() and public.current_user_role() in ('photographer_pending', 'photographer', 'admin'));

drop policy if exists "photographer profiles owner update" on public.photographer_profiles;
create policy "photographer profiles owner update" on public.photographer_profiles
for update
using ((user_id = auth.uid() and status in ('pending', 'needs_revision', 'approved')) or public.current_user_role() = 'admin')
with check ((user_id = auth.uid() and public.current_user_role() in ('photographer_pending', 'photographer', 'admin')) or public.current_user_role() = 'admin');

drop policy if exists "spot submissions read approved own admin" on public.spot_submissions;
create policy "spot submissions read approved own admin" on public.spot_submissions
for select
using (status = 'approved' or submitted_by = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "spot submissions insert own" on public.spot_submissions;
create policy "spot submissions insert own" on public.spot_submissions
for insert
with check (submitted_by = auth.uid());

drop policy if exists "spot submissions update own pending or admin" on public.spot_submissions;
create policy "spot submissions update own pending or admin" on public.spot_submissions
for update
using ((submitted_by = auth.uid() and status in ('pending', 'needs_revision')) or public.current_user_role() = 'admin')
with check ((submitted_by = auth.uid() and status in ('pending', 'needs_revision')) or public.current_user_role() = 'admin');

drop policy if exists "work submissions read approved own admin" on public.work_submissions;
create policy "work submissions read approved own admin" on public.work_submissions
for select
using (status = 'approved' or submitted_by = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "work submissions insert own" on public.work_submissions;
create policy "work submissions insert own" on public.work_submissions
for insert
with check (submitted_by = auth.uid());

drop policy if exists "work submissions update own pending or admin" on public.work_submissions;
create policy "work submissions update own pending or admin" on public.work_submissions
for update
using ((submitted_by = auth.uid() and status in ('pending', 'needs_revision')) or public.current_user_role() = 'admin')
with check ((submitted_by = auth.uid() and status in ('pending', 'needs_revision')) or public.current_user_role() = 'admin');

drop policy if exists "review logs admin read" on public.review_logs;
create policy "review logs admin read" on public.review_logs
for select
using (public.current_user_role() = 'admin');

drop policy if exists "review logs admin insert" on public.review_logs;
create policy "review logs admin insert" on public.review_logs
for insert
with check (public.current_user_role() = 'admin' and reviewer_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('gy-submissions', 'gy-submissions', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "gy submissions public read" on storage.objects;
create policy "gy submissions public read" on storage.objects
for select
using (bucket_id = 'gy-submissions');

drop policy if exists "gy submissions owner upload" on storage.objects;
create policy "gy submissions owner upload" on storage.objects
for insert
with check (
  bucket_id = 'gy-submissions'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "gy submissions owner update" on storage.objects;
create policy "gy submissions owner update" on storage.objects
for update
using (
  bucket_id = 'gy-submissions'
  and ((storage.foldername(name))[2] = auth.uid()::text or public.current_user_role() = 'admin')
)
with check (
  bucket_id = 'gy-submissions'
  and ((storage.foldername(name))[2] = auth.uid()::text or public.current_user_role() = 'admin')
);

drop policy if exists "gy submissions owner delete" on storage.objects;
create policy "gy submissions owner delete" on storage.objects
for delete
using (
  bucket_id = 'gy-submissions'
  and ((storage.foldername(name))[2] = auth.uid()::text or public.current_user_role() = 'admin')
);
