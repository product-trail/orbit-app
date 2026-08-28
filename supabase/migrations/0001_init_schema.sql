-- Orbit — initial schema (spec section 31, DATABASE SCHEMA)
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================================
-- Enums
-- ============================================================================
create type work_type as enum (
  'Task', 'Analysis', 'PRD', 'Experiment', 'Stakeholder', 'Launch', 'Review', 'Other'
);

create type work_status as enum (
  'Backlog', 'In Progress', 'In PRD', 'Ready for Tech Walkthrough',
  'In Development', 'QA / Validation', 'Completed'
);

create type work_priority as enum ('P0', 'P1', 'P2', 'P3');

create type work_impact as enum ('High', 'Medium', 'Low');

create type idea_status as enum (
  'Captured', 'Exploring', 'Validated', 'Rejected', 'Converted'
);

create type initiative_status as enum (
  'Discovery', 'In Progress', 'At Risk', 'Shipped'
);

create type workspace_role as enum ('owner', 'member');

create type activity_entity_type as enum ('work_item', 'idea', 'initiative', 'standup');

-- ============================================================================
-- Shared trigger: keep updated_at current on every UPDATE
-- ============================================================================
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- profiles — one row per auth.users row, created automatically (see trigger
-- at the bottom of this file). Never insert into this table directly from
-- the app.
-- ============================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- workspaces
-- ============================================================================
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspaces_created_by_idx on workspaces(created_by);
create index workspaces_created_at_idx on workspaces(created_at);

-- ============================================================================
-- workspace_members
-- ============================================================================
create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index workspace_members_workspace_id_idx on workspace_members(workspace_id);
create index workspace_members_user_id_idx on workspace_members(user_id);

-- ============================================================================
-- initiatives (created before work_items/ideas since both reference it)
-- ============================================================================
create table initiatives (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  description text not null default '',
  objective text not null default '',
  owner_id uuid not null references profiles(id),
  status initiative_status not null default 'Discovery',
  expected_impact text not null default '',
  metric text,
  current_value text,
  target_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index initiatives_workspace_id_idx on initiatives(workspace_id);
create index initiatives_owner_id_idx on initiatives(owner_id);
create index initiatives_status_idx on initiatives(status);
create index initiatives_created_at_idx on initiatives(created_at);

create trigger initiatives_set_updated_at
  before update on initiatives
  for each row execute function set_updated_at();

-- ============================================================================
-- work_items
-- ============================================================================
create table work_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  description text not null default '',
  type work_type not null default 'Task',
  status work_status not null default 'Backlog',
  priority work_priority not null default 'P2',
  impact work_impact not null default 'Medium',
  owner_id uuid not null references profiles(id),
  created_by uuid not null references profiles(id),
  due_date date,
  jira_id text,
  jira_url text,
  initiative_id uuid references initiatives(id) on delete set null,
  product_area text,
  blocked boolean not null default false,
  blocker_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index work_items_workspace_id_idx on work_items(workspace_id);
create index work_items_owner_id_idx on work_items(owner_id);
create index work_items_status_idx on work_items(status);
create index work_items_priority_idx on work_items(priority);
create index work_items_due_date_idx on work_items(due_date);
create index work_items_initiative_id_idx on work_items(initiative_id);
create index work_items_created_at_idx on work_items(created_at);

create trigger work_items_set_updated_at
  before update on work_items
  for each row execute function set_updated_at();

-- ============================================================================
-- ideas
-- ============================================================================
create table ideas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  problem text not null,
  description text not null default '',
  impact work_impact not null default 'Medium',
  status idea_status not null default 'Captured',
  created_by uuid not null references profiles(id),
  initiative_id uuid references initiatives(id) on delete set null,
  product_area text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ideas_workspace_id_idx on ideas(workspace_id);
create index ideas_status_idx on ideas(status);
create index ideas_initiative_id_idx on ideas(initiative_id);
create index ideas_created_at_idx on ideas(created_at);

create trigger ideas_set_updated_at
  before update on ideas
  for each row execute function set_updated_at();

-- ============================================================================
-- roadmap_items
-- ============================================================================
create table roadmap_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  initiative_id uuid not null references initiatives(id) on delete cascade,
  start_date date not null,
  target_date date not null,
  status initiative_status not null default 'Discovery',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index roadmap_items_workspace_id_idx on roadmap_items(workspace_id);
create index roadmap_items_initiative_id_idx on roadmap_items(initiative_id);
create index roadmap_items_created_at_idx on roadmap_items(created_at);

create trigger roadmap_items_set_updated_at
  before update on roadmap_items
  for each row execute function set_updated_at();

-- ============================================================================
-- comments
-- ============================================================================
create table comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  work_item_id uuid not null references work_items(id) on delete cascade,
  user_id uuid not null references profiles(id),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_workspace_id_idx on comments(workspace_id);
create index comments_work_item_id_idx on comments(work_item_id);
create index comments_created_at_idx on comments(created_at);

create trigger comments_set_updated_at
  before update on comments
  for each row execute function set_updated_at();

-- ============================================================================
-- standups
-- Note: unique(workspace_id, user_id, date) is an addition beyond the spec's
-- literal field list — required so "submit today's standup" can safely
-- upsert instead of creating duplicates.
-- ============================================================================
create table standups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id),
  date date not null,
  yesterday text[] not null default '{}',
  today text[] not null default '{}',
  blocked text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id, date)
);

create index standups_workspace_id_idx on standups(workspace_id);
create index standups_user_id_idx on standups(user_id);
create index standups_date_idx on standups(date);
create index standups_created_at_idx on standups(created_at);

-- ============================================================================
-- activity_logs
-- ============================================================================
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id),
  entity_type activity_entity_type not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_workspace_id_idx on activity_logs(workspace_id);
create index activity_logs_created_at_idx on activity_logs(created_at);

-- ============================================================================
-- Auto-create a profiles row whenever a new auth.users row is created.
-- Reads the display name from signup metadata (options.data.name), passed
-- by the signup form.
-- ============================================================================
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();
