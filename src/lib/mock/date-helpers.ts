import type { WorkItem } from "./types";

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday as start of week
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function isOverdue(item: WorkItem): boolean {
  if (!item.dueDate || item.status === "Completed") return false;
  return item.dueDate < todayISO();
}

export function isDueToday(item: WorkItem): boolean {
  if (!item.dueDate || item.status === "Completed") return false;
  return item.dueDate === todayISO();
}

export function isUpcoming(item: WorkItem, withinDays = 7): boolean {
  if (!item.dueDate || item.status === "Completed") return false;
  const today = new Date();
  const due = new Date(item.dueDate);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= withinDays;
}

export function isCompletedThisWeek(item: WorkItem): boolean {
  if (!item.completedAt) return false;
  const completed = new Date(item.completedAt);
  const now = new Date();
  return completed >= startOfWeek(now) && completed <= endOfWeek(now);
}

export function isThisWeek(item: WorkItem): boolean {
  if (!item.dueDate || item.status === "Completed") return false;
  const due = new Date(item.dueDate);
  const now = new Date();
  return due >= startOfWeek(now) && due <= endOfWeek(now);
}

export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "No due date";
  const date = new Date(`${dueDate}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "YYYY-MM" key for grouping/filtering items by month, e.g. for monthly reports. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Turns a "YYYY-MM" key into a readable label, e.g. "August 2026". */
export function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** The month a work item is "reported against" — its due date if it has one
 * (when the work was planned for), otherwise when it was created. */
export function reportMonthKey(item: WorkItem): string {
  return monthKey(item.dueDate ?? item.createdAt);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
