-- Orbit — Row Level Security (spec sections 32/33, DATABASE SECURITY / RLS TESTING)
-- Run after 0001_init_schema.sql.
--
-- Every workspace-owned table is gated through workspace_members via the two
-- SECURITY DEFINER helpers below. These run as the function owner (bypassing
-- RLS internally), which is required to avoid a classic Postgres RLS
-- recursion trap: a policy on workspace_members that queries
-- workspace_members to check membership would otherwise deadlock/recurse.

create function is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

create function get_workspace_role(ws_id uuid)
returns workspace_role
language sql
security definer
set search_path = public
stable
as $$
  select role from workspace_members
  where workspace_id = ws_id and user_id = auth.uid()
  limit 1;
$$;

-- ============================================================================
-- profiles
-- Names/avatars carry no workspace-scoped secret, so reads are open to any
-- authenticated user (avoids N+1 per-workspace joins just to render an
-- avatar). Writes are restricted to your own row. Inserts are never allowed
-- directly — only the handle_new_user trigger (running as the function
-- owner, which bypasses RLS) creates profile rows.
-- ============================================================================
alter table profiles enable row level security;

create policy profiles_select on profiles
  for select to authenticated
  using (true);

create policy profiles_update_self on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================================
-- workspaces
-- Insert is allowed to any authenticated user (that's how workspace creation
-- starts) but is normally performed via the create_workspace_with_owner RPC
-- (migration 0003) so the workspace row and the creator's owner membership
-- row are created atomically.
-- ============================================================================
alter table workspaces enable row level security;

create policy workspaces_select on workspaces
  for select to authenticated
  using (is_workspace_member(id));

create policy workspaces_insert on workspaces
  for insert to authenticated
  with check (created_by = auth.uid());

create policy workspaces_update on workspaces
  for update to authenticated
  using (get_workspace_role(id) = 'owner')
  with check (get_workspace_role(id) = 'owner');

create policy workspaces_delete on workspaces
  for delete to authenticated
  using (get_workspace_role(id) = 'owner');

-- ============================================================================
-- workspace_members
-- The initial owner row is inserted by the create_workspace_with_owner RPC
-- (security definer, bypasses RLS) — the insert policy below only covers
-- owners inviting additional members after that point.
-- ============================================================================
alter table workspace_members enable row level security;

create policy workspace_members_select on workspace_members
  for select to authenticated
  using (is_workspace_member(workspace_id));

create policy workspace_members_insert on workspace_members
  for insert to authenticated
  with check (get_workspace_role(workspace_id) = 'owner');

create policy workspace_members_update on workspace_members
  for update to authenticated
  using (get_workspace_role(workspace_id) = 'owner')
  with check (get_workspace_role(workspace_id) = 'owner');

create policy workspace_members_delete on workspace_members
  for delete to authenticated
  using (get_workspace_role(workspace_id) = 'owner');

-- ============================================================================
-- work_items / ideas / initiatives / roadmap_items / comments
-- Standard four-policy set: any workspace member may read, create, update,
-- or delete. The MVP UI has no per-item ownership gating on these actions
-- (any PM can update any work item), so RLS matches that intentionally.
-- ============================================================================
create policy work_items_select on work_items
  for select to authenticated using (is_workspace_member(workspace_id));
create policy work_items_insert on work_items
  for insert to authenticated with check (is_workspace_member(workspace_id));
create policy work_items_update on work_items
  for update to authenticated
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
create policy work_items_delete on work_items
  for delete to authenticated using (is_workspace_member(workspace_id));
alter table work_items enable row level security;

create policy ideas_select on ideas
  for select to authenticated using (is_workspace_member(workspace_id));
create policy ideas_insert on ideas
  for insert to authenticated with check (is_workspace_member(workspace_id));
create policy ideas_update on ideas
  for update to authenticated
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
create policy ideas_delete on ideas
  for delete to authenticated using (is_workspace_member(workspace_id));
alter table ideas enable row level security;

create policy initiatives_select on initiatives
  for select to authenticated using (is_workspace_member(workspace_id));
create policy initiatives_insert on initiatives
  for insert to authenticated with check (is_workspace_member(workspace_id));
create policy initiatives_update on initiatives
  for update to authenticated
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
create policy initiatives_delete on initiatives
  for delete to authenticated using (is_workspace_member(workspace_id));
alter table initiatives enable row level security;

create policy roadmap_items_select on roadmap_items
  for select to authenticated using (is_workspace_member(workspace_id));
create policy roadmap_items_insert on roadmap_items
  for insert to authenticated with check (is_workspace_member(workspace_id));
create policy roadmap_items_update on roadmap_items
  for update to authenticated
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
create policy roadmap_items_delete on roadmap_items
  for delete to authenticated using (is_workspace_member(workspace_id));
alter table roadmap_items enable row level security;

create policy comments_select on comments
  for select to authenticated using (is_workspace_member(workspace_id));
create policy comments_insert on comments
  for insert to authenticated with check (is_workspace_member(workspace_id) and user_id = auth.uid());
create policy comments_update on comments
  for update to authenticated
  using (is_workspace_member(workspace_id) and user_id = auth.uid())
  with check (is_workspace_member(workspace_id) and user_id = auth.uid());
create policy comments_delete on comments
  for delete to authenticated using (is_workspace_member(workspace_id) and user_id = auth.uid());
alter table comments enable row level security;

-- ============================================================================
-- standups
-- Self-scoped: any workspace member can read the whole team's standups, but
-- may only create/edit/delete their own.
-- ============================================================================
alter table standups enable row level security;

create policy standups_select on standups
  for select to authenticated
  using (is_workspace_member(workspace_id));

create policy standups_insert on standups
  for insert to authenticated
  with check (is_workspace_member(workspace_id) and user_id = auth.uid());

create policy standups_update on standups
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy standups_delete on standups
  for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- activity_logs
-- Append-only audit trail: any workspace member may read the workspace's
-- log and insert entries attributed to themselves. No update/delete policy
-- is defined, so both are denied by default once RLS is enabled.
-- ============================================================================
alter table activity_logs enable row level security;

create policy activity_logs_select on activity_logs
  for select to authenticated
  using (is_workspace_member(workspace_id));

create policy activity_logs_insert on activity_logs
  for insert to authenticated
  with check (is_workspace_member(workspace_id) and user_id = auth.uid());
