-- Orbit — add three work_status values requested from product feedback:
-- "In Design" and "PRD Complete" slot into the existing PRD pipeline stage,
-- and "Blocked" becomes a selectable status (distinct from the existing
-- `work_items.blocked` boolean flag, which stays as-is for the "blocked
-- right now" indicator shown independent of status).
--
-- Postgres enums only support appending values, so this can't be a plain
-- `create type ... as enum (...)` replace — each new value is added
-- in-place with BEFORE/AFTER so the enum's declaration order still matches
-- the product pipeline. (The app's own status ordering for dropdowns/kanban
-- comes from WORK_STATUSES in src/components/workspace/badges.tsx, not from
-- this declaration order — but keeping them in sync avoids confusion for
-- anyone reading the schema directly.)

alter type work_status add value if not exists 'In Design' after 'In Progress';
alter type work_status add value if not exists 'PRD Complete' after 'In PRD';
alter type work_status add value if not exists 'Blocked' after 'QA / Validation';
