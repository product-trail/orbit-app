"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { NewWorkItemDialog } from "@/components/workspace/new-work-item-dialog";
import { EmptyState } from "@/components/workspace/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isCompletedThisWeek, isOverdue } from "@/lib/mock/date-helpers";
import { cn } from "@/lib/utils";

export default function TeamPage() {
  const { workItems, members, getProfile } = useWorkspaceData();

  const rows = useMemo(
    () =>
      members.map((m) => {
        const mine = workItems.filter((w) => w.ownerId === m.userId);
        const active = mine.filter((w) => w.status !== "Completed");
        return {
          member: m,
          active: active.length,
          highPriority: active.filter((w) => w.priority === "P0" || w.priority === "P1").length,
          overdue: mine.filter(isOverdue).length,
          blocked: mine.filter((w) => w.blocked).length,
          completedThisWeek: mine.filter(isCompletedThisWeek).length,
        };
      }),
    [members, workItems],
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Team Workload &amp; Progress
        </h1>
        <p className="text-sm text-muted-foreground">
          A lightweight view of what everyone is carrying right now.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No team members yet" description="Invite teammates to see their workload here." />
      ) : (
        <>
          {/* Table — tablet and up. */}
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Active Work</TableHead>
                  <TableHead>High Priority</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>Blocked</TableHead>
                  <TableHead>Completed This Week</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ member, active, highPriority, overdue, blocked, completedThisWeek }) => {
                  const profile = getProfile(member.userId);
                  return (
                    <TableRow key={member.userId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarFallback>{profile.initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{profile.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{active}</TableCell>
                      <TableCell className={highPriority > 0 ? "font-medium text-warning" : "text-muted-foreground"}>
                        {highPriority}
                      </TableCell>
                      <TableCell className={overdue > 0 ? "font-medium text-danger" : "text-muted-foreground"}>
                        {overdue}
                      </TableCell>
                      <TableCell className={blocked > 0 ? "font-medium text-danger" : "text-muted-foreground"}>
                        {blocked}
                      </TableCell>
                      <TableCell className="text-success">{completedThisWeek}</TableCell>
                      <TableCell>
                        <NewWorkItemDialog
                          defaultOwnerId={member.userId}
                          trigger={<Button size="sm" variant="outline">Assign work</Button>}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Cards — phones only. */}
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map(({ member, active, highPriority, overdue, blocked, completedThisWeek }) => {
              const profile = getProfile(member.userId);
              return (
                <div
                  key={member.userId}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback>{profile.initials}</AvatarFallback>
                      </Avatar>
                      <span className="truncate font-medium text-foreground">{profile.name}</span>
                    </div>
                    <NewWorkItemDialog
                      defaultOwnerId={member.userId}
                      trigger={<Button size="sm" variant="outline">Assign</Button>}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{active}</span>
                      <span className="text-[10px] text-muted-foreground">Active</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className={cn("text-sm font-medium", highPriority > 0 ? "text-warning" : "text-foreground")}>
                        {highPriority}
                      </span>
                      <span className="text-[10px] text-muted-foreground">High Pri.</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className={cn("text-sm font-medium", overdue > 0 ? "text-danger" : "text-foreground")}>
                        {overdue}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Overdue</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className={cn("text-sm font-medium", blocked > 0 ? "text-danger" : "text-foreground")}>
                        {blocked}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Blocked</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-success">{completedThisWeek}</span>
                      <span className="text-[10px] text-muted-foreground">Done wk</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
