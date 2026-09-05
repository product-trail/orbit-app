import type { BizColumnKey } from "@/lib/mock/types";

export const BIZ_COLUMN_KEYS: BizColumnKey[] = ["rank", "work", "impact", "status", "goLive", "owner"];

/** Fallback labels for the Business Prioritization view's built-in columns.
 * These were written from the Paytm Postpaid team's perspective (e.g.
 * "Impact (Signups)") — other teams can override any of them per workspace
 * from Settings without needing a code change. */
export const DEFAULT_BIZ_COLUMN_LABELS: Record<BizColumnKey, string> = {
  rank: "Rank",
  work: "Work",
  impact: "Impact (Signups)",
  status: "Status",
  goLive: "Go-Live Date",
  owner: "Owner",
};
