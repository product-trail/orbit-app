-- Database-level fix for Product Backlog privacy.
--
-- Until now, work_items_select/update/delete only checked workspace
-- membership (see 0002_rls_policies.sql's "any PM can update any work item"
-- comment) - the Next.js app's own UI was the only thing limiting a member
-- to "my items only" on the Product Backlog page
-- (src/app/app/[workspaceSlug]/work/page.tsx). The database itself would
-- still hand over every workspace member's full work item list and content
-- to anyone who asked for it directly (e.g. via the browser's network tab
-- or a raw API call), regardless of what the UI chose to render.
--
-- This migration moves the restriction into Postgres itself, so it holds no
-- matter how the data is requested. An item is visible to a member if:
--   - they're a workspace owner (unrestricted, exactly as before), or
--   - they own the item (owner_id = auth.uid()), or
--   - it's promoted to Business Prioritization (business_rank is not null,
--     see 0007_business_prioritization.sql) - intentionally shared
--     workspace-wide, matching the app's existing behavior there, or
--   - it's linked to a roadmap initiative (initiative_id is not null) -
--     Roadmap's initiative detail panel shows linked work item titles to
--     every member today, so this keeps that feature working unchanged.
-- Everything else (a member's colleague's plain backlog item, not yet on
-- the business or roadmap radar) is now private to its owner.
--
-- work_items_insert is intentionally left unrestricted beyond workspace
-- membership: a PM creating a task assigns `owner_id` to whichever teammate
-- it's for (see createWorkItem in workspace-data-provider.tsx) - a
-- legitimate "create this on someone else's behalf" case where nothing is
-- being read, so there's no privacy concern to gate.
--
-- comments inherit the same rule via can_view_work_item() below, since a
-- comment is just as sensitive as the work item it's attached to - without
-- this, a member could still read every comment on items they can no longer
-- see directly.
--
-- The Team page's per-member workload counts (active/overdue/blocked/etc.)
-- need an aggregate across every member's items, which the policy above
-- would otherwise undercount for a member viewing it. get_team_workload()
-- below computes those counts server-side instead - the member's browser
-- receives only numbers, never a colleague's item titles/content, which is
-- actually tighter than before (today's single shared fetch handed the full
-- item list to the browser even though the UI only rendered counts from it).

create function can_view_work_item(wi_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from work_items wi
    where wi.id = wi_id
      and is_workspace_member(wi.workspace_id)
      and (
        get_workspace_role(wi.workspace_id) = 'owner'
        or wi.owner_id = auth.uid()
        or wi.business_rank is not null
        or wi.initiative_id is not null
      )
  );
$$;

drop policy work_items_select on work_items;
create policy work_items_select on work_items
  for select to authenticated using (
    is_workspace_member(workspace_id)
    and (
      get_workspace_role(workspace_id) = 'owner'
      or owner_id = auth.uid()
      or business_rank is not null
      or initiative_id is not null
    )
  );

drop policy work_items_update on work_items;
create policy work_items_update on work_items
  for update to authenticated
  using (
    is_workspace_member(workspace_id)
    and (
      get_workspace_role(workspace_id) = 'owner'
      or owner_id = auth.uid()
      or business_rank is not null
      or initiative_id is not null
    )
  )
  with check (
    is_workspace_member(workspace_id)
    and (
      get_workspace_role(workspace_id) = 'owner'
      or owner_id = auth.uid()
      or business_rank is not null
      or initiative_id is not null
    )
  );

drop policy work_items_delete on work_items;
create policy work_items_delete on work_items
  for delete to authenticated using (
    is_workspace_member(workspace_id)
    and (
      get_workspace_role(workspace_id) = 'owner'
      or owner_id = auth.uid()
      or business_rank is not null
      or initiative_id is not null
    )
  );

drop policy comments_select on comments;
create policy comments_select on comments
  for select to authenticated using (
    is_workspace_member(workspace_id) and can_view_work_item(work_item_id)
  );

-- ============================================================================
-- get_team_workload
-- Per-member workload counts for the Team page. SECURITY DEFINER so it can
-- aggregate across every member's items regardless of the row-level
-- restriction above - but only ever for a workspace the caller actually
-- belongs to (checked explicitly below, since bypassing RLS means that
-- guard has to be re-implemented here).
-- ============================================================================
create function get_team_workload(p_workspace_id uuid)
returns table (
  user_id uuid,
  active integer,
  high_priority integer,
  overdue integer,
  blocked integer,
  completed_this_week integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    wi.owner_id as user_id,
    count(*) filter (where wi.status <> 'Completed')::integer as active,
    count(*) filter (
      where wi.status <> 'Completed' and wi.priority in ('P0', 'P1')
    )::integer as high_priority,
    count(*) filter (
      where wi.due_date is not null and wi.status <> 'Completed' and wi.due_date < current_date
    )::integer as overdue,
    count(*) filter (where wi.blocked)::integer as blocked,
    count(*) filter (
      where wi.completed_at is not null
        and wi.completed_at >= date_trunc('week', now())
        and wi.completed_at < date_trunc('week', now()) + interval '7 days'
    )::integer as completed_this_week
  from work_items wi
  where wi.workspace_id = p_workspace_id
    and is_workspace_member(p_workspace_id)
  group by wi.owner_id;
$$;

grant execute on function get_team_workload(uuid) to authenticated;
