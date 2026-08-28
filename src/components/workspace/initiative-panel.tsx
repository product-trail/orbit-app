"use client";

import { InitiativeStatusBadge, StatusBadge } from "@/components/workspace/badges";
import { NewWorkItemDialog } from "@/components/workspace/new-work-item-dialog";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatDueDate } from "@/lib/mock/date-helpers";

export function InitiativePanel({
  initiativeId,
  onClose,
  onOpenWorkItem,
}: {
  initiativeId: string | null;
  onClose: () => void;
  onOpenWorkItem?: (workItemId: string) => void;
}) {
  const { initiatives, roadmapItems, workItems, getProfile } = useWorkspaceData();

  const initiative = initiatives.find((i) => i.id === initiativeId) ?? null;
  const roadmapItem = initiativeId
    ? roadmapItems.find((r) => r.initiativeId === initiativeId)
    : null;
  const linkedWork = workItems.filter((w) => w.initiativeId === initiativeId);
  const completedWork = linkedWork.filter((w) => w.status === "Completed");

  return (
    <Sheet open={!!initiative} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {initiative && (
          <>
            <SheetHeader className="border-b border-border pb-4">
              <SheetTitle className="pr-8 text-lg leading-snug">{initiative.name}</SheetTitle>
              <SheetDescription className="sr-only">Initiative detail</SheetDescription>
              {roadmapItem && (
                <span className="text-xs text-muted-foreground">
                  Target {formatDueDate(roadmapItem.targetDate)}
                </span>
              )}
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4 py-4">
              <Field label="Objective">
                <p className="text-sm text-foreground">{initiative.objective}</p>
              </Field>

              <Field label="Expected Impact">
                <p className="text-sm text-foreground">{initiative.expectedImpact}</p>
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Metric">
                  <span className="text-sm text-foreground">{initiative.metric ?? "—"}</span>
                </Field>
                <Field label="Current">
                  <span className="text-sm font-medium text-foreground">
                    {initiative.currentValue ?? "—"}
                  </span>
                </Field>
                <Field label="Target">
                  <span className="text-sm font-medium text-brand-indigo">
                    {initiative.targetValue ?? "—"}
                  </span>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Owner">
                  <div className="flex items-center gap-1.5">
                    <Avatar size="sm">
                      <AvatarFallback>{getProfile(initiative.ownerId).initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground">
                      {getProfile(initiative.ownerId).name}
                    </span>
                  </div>
                </Field>
                <Field label="Status">
                  <InitiativeStatusBadge status={initiative.status} />
                </Field>
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Linked Work {linkedWork.length > 0 && `(${linkedWork.length})`} · {completedWork.length} completed
                  </p>
                  <NewWorkItemDialog
                    initiativeId={initiative.id}
                    initialTitle={initiative.name}
                    initialDescription={initiative.objective}
                    trigger={<Button size="sm" variant="outline">+ Add work item</Button>}
                  />
                </div>

                {linkedWork.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No work linked to this initiative yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {linkedWork.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => onOpenWorkItem?.(w.id)}
                        className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-left hover:border-brand-indigo/40"
                      >
                        <span className="truncate text-sm text-foreground">{w.title}</span>
                        <StatusBadge status={w.status} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
