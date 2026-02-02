-- Create projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  status text check (status in ('Active', 'Planning', 'On Hold', 'Completed')) default 'Active',
  owner_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.projects enable row level security;

-- Drop existing policies if any to avoid conflicts
drop policy if exists "Enable read access for authenticated users" on public.projects;
drop policy if exists "Enable insert for authenticated users" on public.projects;
drop policy if exists "Enable update for authenticated users" on public.projects;
drop policy if exists "Enable delete for authenticated users" on public.projects;

-- Create policies
create policy "Enable read access for authenticated users" on public.projects
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.projects
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.projects
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.projects
  for delete using (auth.role() = 'authenticated');

-- Grant access to authenticated users
grant all on public.projects to authenticated;
