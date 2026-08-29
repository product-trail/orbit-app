-- Work items can now capture the same "expected impact" narrative that
-- initiatives already have (e.g. "increase landing page conversion by 2%"),
-- so impact doesn't only exist as a coarse High/Medium/Low enum. Nullable —
-- most granular tasks won't have a standalone measurable outcome, only work
-- tied to a real metric will.
alter table work_items add column expected_impact text;
