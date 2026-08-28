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
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
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
      )}
    </div>
  );
}
