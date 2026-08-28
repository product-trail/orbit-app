"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Standup } from "@/lib/mock/types";

const linesToList = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

function isWithinDays(iso: string, days: number) {
  const diffMs = Date.now() - new Date(iso).getTime();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
}

export function StandupForm({
  existing,
  onSubmitted,
  onCancel,
}: {
  existing?: Standup;
  onSubmitted?: () => void;
  onCancel?: () => void;
}) {
  const { workItems, currentUserId, submitStandup } = useWorkspaceData();

  const suggestions = useMemo(() => {
    const mine = workItems.filter((w) => w.ownerId === currentUserId);
    return {
      yesterday: mine
        .filter((w) => w.status === "Completed" && w.completedAt && isWithinDays(w.completedAt, 2))
        .map((w) => w.title),
      today: mine
        .filter((w) => w.status !== "Completed" && w.status !== "Backlog")
        .map((w) => w.title),
      blocked: mine.filter((w) => w.blocked).map((w) => w.title),
    };
  }, [workItems, currentUserId]);

  const [yesterday, setYesterday] = useState(
    (existing?.yesterday ?? suggestions.yesterday).join("\n"),
  );
  const [today, setToday] = useState((existing?.today ?? suggestions.today).join("\n"));
  const [blocked, setBlocked] = useState((existing?.blocked ?? suggestions.blocked).join("\n"));
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await submitStandup({
        yesterday: linesToList(yesterday),
        today: linesToList(today),
        blocked: linesToList(blocked),
      });
      toast.success(existing ? "Standup updated" : "Standup shared");
      onSubmitted?.();
    } catch (error) {
      toast.error("Couldn't share standup", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="su-yesterday">Yesterday</Label>
          <Textarea
            id="su-yesterday"
            value={yesterday}
            onChange={(e) => setYesterday(e.target.value)}
            placeholder="One item per line"
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="su-today">Today</Label>
          <Textarea
            id="su-today"
            value={today}
            onChange={(e) => setToday(e.target.value)}
            placeholder="One item per line"
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="su-blocked">Blocked</Label>
          <Textarea
            id="su-blocked"
            value={blocked}
            onChange={(e) => setBlocked(e.target.value)}
            placeholder="One item per line — leave blank if nothing's blocked"
            rows={2}
          />
        </div>
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={submit} disabled={submitting}>
            {submitting ? "Saving…" : existing ? "Save changes" : "Share standup"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
