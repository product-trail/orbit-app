import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Extracts a short ticket key from a value that may be a full JIRA URL,
 * e.g. "https://jira.example.com/browse/LB-63734" -> "LB-63734". Values
 * that are already a bare key (e.g. "LB-63734") pass through unchanged. */
export function shortJiraId(value: string): string {
  const trimmed = value.trim();
  const lastSegment = trimmed.split("/").filter(Boolean).pop();
  return lastSegment || trimmed;
}

/** Normalizes a raw JIRA field entry (which may be a pasted full URL or a
 * bare ticket key) into a clean `{ id, url }` pair for storage — preserving
 * a real pasted URL instead of overwriting it with a placeholder domain. */
export function parseJiraInput(raw: string): { id: string; url: string } {
  const trimmed = raw.trim();
  const id = shortJiraId(trimmed);
  const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://jira.example.com/browse/${id}`;
  return { id, url };
}
