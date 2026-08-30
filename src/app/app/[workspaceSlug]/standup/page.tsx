"use client";

import { useMemo, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { StandupCard } from "@/components/workspace/standup-card";
import { StandupForm } from "@/components/workspace/standup-form";
import { EmptyState } from "@/components/workspace/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function StandupPage() {
  const { standups, members, getProfile, currentUserId } = useWorkspaceData();
  const [tab, setTab] = useState<"today" | "history">("today");
  const [editingMine, setEditingMine] = useState(false);
  const [historyDate, setHistoryDate] = useState<string | null>(null);

  const today = todayISO();
  const todaysStandups = standups.filter((s) => s.date === today);
  const mine = todaysStandups.find((s) => s.userId === currentUserId);
  const othersToday = todaysStandups.filter((s) => s.userId !== currentUserId);

  const historyDates = useMemo(
    () => [...new Set(standups.map((s) => s.date))].sort((a, b) => b.localeCompare(a)),
    [standups],
  );
  const selectedDate = historyDate ?? historyDates.find((d) => d !== today) ?? historyDates[0] ?? null;
  const selectedStandups = standups.filter((s) => s.date === selectedDate);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Standup</h1>
        <p className="text-sm text-muted-foreground">Postpaid Team Standup — async, no meeting required.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as "today" | "history")}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Your standup
            </h2>
            {mine && !editingMine ? (
              <div className="flex flex-col gap-2">
                <StandupCard standup={mine} />
                <button
                  type="button"
                  className="self-end text-xs font-medium text-brand-indigo hover:underline"
                  onClick={() => setEditingMine(true)}
                >
                  Edit
                </button>
              </div>
            ) : (
              <StandupForm
                existing={mine}
                onSubmitted={() => setEditingMine(false)}
                onCancel={mine ? () => setEditingMine(false) : undefined}
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Team snapshot
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {members.map((m) => {
                const s = todaysStandups.find((su) => su.userId === m.userId);
                const profile = getProfile(m.userId);
                return (
                  <div
                    key={m.userId}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <Avatar size="sm">
                        <AvatarFallback>{profile.initials}</AvatarFallback>
                      </Avatar>
                      <span className="truncate text-xs font-medium text-foreground">{profile.name}</span>
                    </div>
                    {s ? (
                      <p className="text-xs text-muted-foreground">
                        Yesterday: {s.yesterday.length} · Today: {s.today.length} · Blocked:{" "}
                        <span className={cn(s.blocked.length > 0 && "font-medium text-danger")}>
                          {s.blocked.length}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No update yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {othersToday.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Team standups
              </h2>
              <div className="flex flex-col gap-3">
                {othersToday.map((s) => (
                  <StandupCard key={s.id} standup={s} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {historyDates.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title="No standup history yet"
              description="Submitted standups will show up here."
            />
          ) : (
            <div className="flex flex-col gap-4 md:flex-row md:gap-6">
              <div className="flex gap-1 overflow-x-auto md:w-32 md:shrink-0 md:flex-col md:overflow-visible">
                {historyDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setHistoryDate(d)}
                    className={cn(
                      "shrink-0 rounded-md px-2.5 py-1.5 text-left text-sm font-medium transition-colors",
                      d === selectedDate
                        ? "bg-brand-indigo/10 text-brand-indigo"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })}
                  </button>
                ))}
              </div>
              <div className="flex flex-1 flex-col gap-3">
                {selectedStandups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No standups for this date.</p>
                ) : (
                  selectedStandups.map((s) => <StandupCard key={s.id} standup={s} />)
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
