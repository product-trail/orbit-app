-- Business Prioritization: per-workspace column customization.
--
-- go_live_date: shared by the tech team once known, so PMs can update it
-- later (often blank while an item is still being negotiated with the
-- business team).
--
-- custom_field_values: values for workspace-defined extra columns (see
-- business_prioritization_fields below), keyed by field `key`. Stored on the
-- work item itself (not a separate values table) since each work item has at
-- most a handful of custom fields.
--
-- workspaces.settings: currently holds only businessPrioritizationLabels, an
-- owner-editable override of the built-in column labels. The defaults were
-- written from the Paytm Postpaid team's perspective; other teams/companies
-- can relabel per workspace without a code change.
--
-- business_prioritization_fields: workspace-defined extra columns on the
-- Business Prioritization view, appended after the built-in ones. `key` is
-- generated client-side (field_<8 hex chars>) so there's no server-side
-- slug-collision handling to write.
alter table work_items add column go_live_date date;
alter table work_items add column custom_field_values jsonb not null default '{}'::jsonb;
alter table workspaces add column settings jsonb not null default '{}'::jsonb;

create type business_prioritization_field_type as enum ('text', 'number', 'date');

create table business_prioritization_fields (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  key text not null,
  label text not null,
  type business_prioritization_field_type not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (workspace_id, key)
);

-- Same standard four-policy set as work_items/ideas/initiatives/roadmap_items
-- (see 0002_rls_policies.sql): any workspace member may read, create,
-- update, or delete.
alter table business_prioritization_fields enable row level security;

create policy business_prioritization_fields_select on business_prioritization_fields
  for select to authenticated using (is_workspace_member(workspace_id));
create policy business_prioritization_fields_insert on business_prioritization_fields
  for insert to authenticated with check (is_workspace_member(workspace_id));
create policy business_prioritization_fields_update on business_prioritization_fields
  for update to authenticated
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
create policy business_prioritization_fields_delete on business_prioritization_fields
  for delete to authenticated using (is_workspace_member(workspace_id));
