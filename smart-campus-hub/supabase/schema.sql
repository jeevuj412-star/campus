-- Smart Campus Hub schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  student_id text not null check (char_length(student_id) between 1 and 80),
  category text not null check (category in (
    'Wi-Fi Issue',
    'Campus Infrastructure',
    'Ragging/Harassment',
    'Faculty/Academic Query',
    'Campus Development Suggestion'
  )),
  description text not null check (char_length(description) between 10 and 5000),
  status text not null default 'received' check (status in ('received','in_review','resolved')),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  event_date date not null,
  poster_url text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.complaints enable row level security;
alter table public.events enable row level security;

-- Public visitors can submit a complaint, but cannot read or update complaint rows.
-- Keep this insert policy narrow; do not add a public SELECT policy for complaints.
drop policy if exists "Anyone can submit a complaint" on public.complaints;
create policy "Anyone can submit a complaint"
  on public.complaints for insert to anon, authenticated
  with check (
    char_length(student_id) between 1 and 80
    and char_length(description) between 10 and 5000
    and category in ('Wi-Fi Issue','Campus Infrastructure','Ragging/Harassment','Faculty/Academic Query','Campus Development Suggestion')
  );

-- Campus event feed is public; only authenticated users whose app_metadata role is admin can manage events.
drop policy if exists "Anyone can view events" on public.events;
create policy "Anyone can view events"
  on public.events for select to anon, authenticated using (true);

drop policy if exists "Admins can add events" on public.events;
create policy "Admins can add events"
  on public.events for insert to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update events" on public.events;
create policy "Admins can update events"
  on public.events for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
  on public.events for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- IMPORTANT:
-- 1. Never expose the Supabase service_role key in Vite/client code.
-- 2. The Student ID means this is confidential, not anonymous.
-- 3. Do not create a complaint SELECT policy for students/public.
-- 4. For real deployments, add a staff-only secure complaint review workflow.
-- 5. Assign app_metadata.role = "admin" only from a trusted server/admin tool,
--    never from user-editable user_metadata. Then sign out/in to refresh the JWT.
