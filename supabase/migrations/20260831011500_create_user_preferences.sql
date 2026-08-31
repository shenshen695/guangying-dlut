create table if not exists public.user_preferences (
  user_id uuid primary key,
  preferred_style text,
  preferred_colors text[],
  preferred_scenes text[],
  people_preference text,
  clothing_mentioned text,
  disliked_styles text[] default '{}',
  updated_at timestamp with time zone default now()
);

alter table public.user_preferences enable row level security;

grant select, insert, update on public.user_preferences to authenticated;

drop policy if exists "user preferences owner read" on public.user_preferences;
create policy "user preferences owner read" on public.user_preferences
for select
using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "user preferences owner insert" on public.user_preferences;
create policy "user preferences owner insert" on public.user_preferences
for insert
with check (user_id = auth.uid());

drop policy if exists "user preferences owner update" on public.user_preferences;
create policy "user preferences owner update" on public.user_preferences
for update
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');
