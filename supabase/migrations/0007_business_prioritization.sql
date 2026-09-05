-- Business Prioritization: a separate stack-ranked view where PRD-complete
-- work items get negotiated/ordered with the business team, independent of
-- engineering's own P0-P3 priority field.
--
-- business_rank: fractional order key (null = not in the business queue).
-- Using a float lets the UI insert an item between two neighbors by taking
-- their midpoint, without renumbering the whole list on every drag.
--
-- expected_signups: absolute-value business impact for this view (e.g. "No.
-- of Signups" in the Paytm Postpaid use case), distinct from the coarse
-- High/Medium/Low `impact` enum used elsewhere.
alter table work_items add column business_rank double precision;
alter table work_items add column expected_signups integer;
