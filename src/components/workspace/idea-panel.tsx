"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { InitiativeStatusBadge } from "@/components/workspace/badges";
import { ConvertIdeaDialog } from "@/components/workspace/convert-idea-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDueDate } from "@/lib/mock/date-helpers";
import type { IdeaStatus } from "@/lib/mock/types";

const MANUAL_STATUSES: IdeaStatus[] = ["Captured", "Exploring", "Validated", "Rejected"];

export function IdeaPanel({
  ideaId,
  onClose,
  onOpenInitiative,
}: {
  ideaId: string | null;
  onClose: () => void;
  onOpenInitiative?: (initiativeId: string) => void;
}) {
  const { ideas, initiatives, getProfile, updateIdeaStatus } = useWorkspaceData();

  const idea = ideas.find((i) => i.id === ideaId) ?? null;
  const initiative = idea?.initiativeId
    ? initiatives.find((i) => i.id === idea.initiativeId)
    : null;

  return (
    <Sheet open={!!idea} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {idea && (
          <>
            <SheetHeader className="border-b border-border pb-4">
              <SheetTitle className="pr-8 text-lg leading-snug">{idea.title}</SheetTitle>
              <SheetDescription className="sr-only">Idea detail</SheetDescription>
              <span className="text-xs text-muted-foreground">
                Captured by {getProfile(idea.createdBy).name} · {formatDueDate(idea.createdAt.slice(0, 10))}
              </span>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Status">
                  {idea.status === "Converted" ? (
                    <span className="text-sm font-medium text-brand-purple">Converted</span>
                  ) : (
                    <Select
                      value={idea.status}
                      onValueChange={(v) => v && updateIdeaStatus(idea.id, v as IdeaStatus)}
                    >
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MANUAL_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>

                <Field label="Impact">
                  <span className="text-sm text-foreground">{idea.impact}</span>
                </Field>

                <Field label="Product Area">
                  <span className="text-sm text-foreground">{idea.productArea ?? "—"}</span>
                </Field>
              </div>

              <Field label="Problem">
                <p className="text-sm text-foreground">{idea.problem}</p>
              </Field>

              <Field label="Description">
                <p className="text-sm text-foreground">{idea.description || "No description."}</p>
              </Field>

              <Separator />

              {initiative ? (
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Sparkles className="size-3.5" />
                    Converted to initiative
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenInitiative?.(initiative.id)}
                    className="flex items-center justify-between gap-2 text-left"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">{initiative.name}</span>
                      <div className="flex items-center gap-2">
                        <InitiativeStatusBadge status={initiative.status} />
                        <Avatar size="sm">
                          <AvatarFallback>{getProfile(initiative.ownerId).initials}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <ConvertIdeaDialog ideaId={idea.id} ideaTitle={idea.title} />
              )}
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
