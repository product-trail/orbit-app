-- Orbit — RPCs for operations that must be atomic across two tables.
-- Run after 0002_rls_policies.sql.

-- ============================================================================
-- create_workspace_with_owner
-- Atomically creates a workspace and the creator's 'owner' membership row.
-- Must be SECURITY DEFINER: at the moment the membership row is inserted,
-- no workspace_members row exists yet for this workspace, so the regular
-- workspace_members_insert policy (which requires an existing 'owner' role)
-- would otherwise reject it. This function is the one sanctioned bypass —
-- it still requires a valid authenticated session.
-- ============================================================================
create function create_workspace_with_owner(p_name text, p_slug text)
returns workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace workspaces;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into workspaces (name, slug, created_by)
  values (p_name, p_slug, v_user_id)
  returning * into v_workspace;

  insert into workspace_members (workspace_id, user_id, role)
  values (v_workspace.id, v_user_id, 'owner');

  return v_workspace;
end;
$$;

grant execute on function create_workspace_with_owner(text, text) to authenticated;

-- ============================================================================
-- convert_idea_to_initiative
-- Atomically creates the initiative and marks the source idea as Converted.
-- Deliberately SECURITY INVOKER (the default) — both underlying writes
-- (initiatives insert, ideas update) are already permitted by the regular
-- RLS policies for any workspace member, so running as the caller lets
-- Postgres enforce that naturally instead of duplicating the check here.
-- If the caller isn't a member of the idea's workspace, the initial select
-- returns no rows (blocked by ideas_select) and the function raises.
-- ============================================================================
create function convert_idea_to_initiative(
  p_idea_id uuid,
  p_name text,
  p_objective text,
  p_owner_id uuid,
  p_expected_impact text,
  p_metric text,
  p_current_value text,
  p_target_value text
)
returns initiatives
language plpgsql
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_initiative initiatives;
begin
  select workspace_id into v_workspace_id from ideas where id = p_idea_id;

  if v_workspace_id is null then
    raise exception 'idea not found or not accessible';
  end if;

  insert into initiatives (
    workspace_id, name, objective, owner_id, expected_impact, metric, current_value, target_value
  )
  values (
    v_workspace_id, p_name, p_objective, p_owner_id, p_expected_impact, p_metric, p_current_value, p_target_value
  )
  returning * into v_initiative;

  update ideas
  set status = 'Converted', initiative_id = v_initiative.id
  where id = p_idea_id;

  return v_initiative;
end;
$$;

grant execute on function convert_idea_to_initiative(uuid, text, text, uuid, text, text, text, text) to authenticated;
