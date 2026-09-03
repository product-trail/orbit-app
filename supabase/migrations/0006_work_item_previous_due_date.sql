-- When a work item's due date is pushed out after it's already overdue, we
-- want to keep a visible record of the slip (shown struck-through next to
-- the new due date) rather than silently losing the original date — this is
-- what lets the team later see how often deadlines actually got missed.
-- Nullable — most items are never rescheduled past their due date.
alter table work_items add column previous_due_date date;
