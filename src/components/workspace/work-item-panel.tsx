"use client";

import { useState } from "react";
import { AlertTriangle, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { PRIORITIES, WORK_STATUSES } from "@/components/workspace/badges";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDateTime, formatDueDate, timeAgo } from "@/lib/mock/date-helpers";
import { parseJiraInput, shortJiraId } from "@/lib/utils";
import type { Impact } from "@/lib/mock/types";

const IMPACTS: Impact[] = ["High", "Medium", "Low"];
const NO_INITIATIVE = "none";

export function WorkItemPanel({
  itemId,
  onClose,
}: {
  itemId: string | null;
  onClose: () => void;
}) {
  const {
    workItems,
    members,
    getProfile,
    initiatives,
    comments,
    activityLogs,
    updateWorkItemStatus,
    updateWorkItemPriority,
    updateWorkItemImpact,
    updateWorkItemOwner,
    updateWorkItemDueDate,
    updateWorkItemDescription,
    updateWorkItemJira,
    updateWorkItemProductArea,
    updateWorkItemInitiative,
    updateWorkItemExpectedImpact,
    toggleWorkItemBlocked,
    addComment,
    deleteWorkItem,
  } = useWorkspaceData();

  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [editingExpectedImpact, setEditingExpectedImpact] = useState(false);
  const [expectedImpactDraft, setExpectedImpactDraft] = useState("");
  const [addingJira, setAddingJira] = useState(false);
  const [jiraIdDraft, setJiraIdDraft] = useState("");
  const [editingProductArea, setEditingProductArea] = useState(false);
  const [productAreaDraft, setProductAreaDraft] = useState("");
  const [addingBlocker, setAddingBlocker] = useState(false);
  const [blockerDraft, setBlockerDraft] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const item = workItems.find((w) => w.id === itemId) ?? null;
  const itemComments = comments
    .filter((c) => c.workItemId === itemId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const itemActivity = activityLogs
    .filter((a) => a.entityId === itemId && a.entityType === "work_item")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {item && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-12 text-muted-foreground hover:text-danger"
              onClick={() => setConfirmDeleteOpen(true)}
              aria-label="Delete work item"
            >
              <Trash2 className="size-4" />
            </Button>

            <SheetHeader className="border-b border-border pb-4">
              <SheetTitle className="pr-16 text-lg leading-snug">{item.title}</SheetTitle>
              <SheetDescription className="sr-only">Work item detail</SheetDescription>
              <span className="text-xs text-muted-foreground">{item.type}</span>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Status">
                  <Select
                    value={item.status}
                    onValueChange={(v) => v && updateWorkItemStatus(item.id, v as typeof item.status)}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WORK_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Priority">
                  <Select
                    value={item.priority}
                    onValueChange={(v) => v && updateWorkItemPriority(item.id, v as typeof item.priority)}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Impact">
                  <Select
                    value={item.impact}
                    onValueChange={(v) => v && updateWorkItemImpact(item.id, v as Impact)}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {IMPACTS.map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Owner">
                  <Select
                    value={item.ownerId}
                    onValueChange={(v) => v && updateWorkItemOwner(item.id, v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{(v: string) => getProfile(v).name}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {getProfile(m.userId).name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Due Date">
                  <div className="flex flex-col gap-1">
                    {item.previousDueDate && (
                      <span className="text-xs text-muted-foreground">
                        Missed <span className="line-through">{formatDueDate(item.previousDueDate)}</span>
                      </span>
                    )}
                    <Input
                      type="date"
                      value={item.dueDate ?? ""}
                      onChange={(e) => updateWorkItemDueDate(item.id, e.target.value || null)}
                      className="h-8"
                    />
                  </div>
                </Field>

                <Field label="Product Area">
                  {editingProductArea ? (
                    <div className="flex gap-2">
                      <Input
                        value={productAreaDraft}
                        onChange={(e) => setProductAreaDraft(e.target.value)}
                        placeholder="Billing"
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateWorkItemProductArea(item.id, productAreaDraft.trim() || null);
                            setEditingProductArea(false);
                          } else if (e.key === "Escape") {
                            setEditingProductArea(false);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          updateWorkItemProductArea(item.id, productAreaDraft.trim() || null);
                          setEditingProductArea(false);
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-fit text-sm text-foreground hover:text-brand-indigo hover:underline"
                      onClick={() => {
                        setProductAreaDraft(item.productArea ?? "");
                        setEditingProductArea(true);
                      }}
                    >
                      {item.productArea ?? "Set product area"}
                    </button>
                  )}
                </Field>
              </div>

              <Field label="Initiative">
                <Select
                  value={item.initiativeId ?? NO_INITIATIVE}
                  onValueChange={(v) =>
                    v && updateWorkItemInitiative(item.id, v === NO_INITIATIVE ? null : v)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: string) =>
                        v === NO_INITIATIVE
                          ? "Not linked"
                          : (initiatives.find((i) => i.id === v)?.name ?? "Not linked")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_INITIATIVE}>Not linked</SelectItem>
                    {initiatives.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Description</p>
                  {!editingDescription && (
                    <button
                      type="button"
                      className="text-xs font-medium text-brand-indigo hover:underline"
                      onClick={() => {
                        setDescriptionDraft(item.description);
                        setEditingDescription(true);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingDescription ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      value={descriptionDraft}
                      onChange={(e) => setDescriptionDraft(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          updateWorkItemDescription(item.id, descriptionDraft);
                          setEditingDescription(false);
                        }}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingDescription(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground">{item.description || "No description."}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Expected impact</p>
                  {!editingExpectedImpact && (
                    <button
                      type="button"
                      className="text-xs font-medium text-brand-indigo hover:underline"
                      onClick={() => {
                        setExpectedImpactDraft(item.expectedImpact ?? "");
                        setEditingExpectedImpact(true);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingExpectedImpact ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      value={expectedImpactDraft}
                      onChange={(e) => setExpectedImpactDraft(e.target.value)}
                      placeholder="e.g. Increase landing page conversion by 2%"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          updateWorkItemExpectedImpact(item.id, expectedImpactDraft.trim() || null);
                          setEditingExpectedImpact(false);
                        }}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingExpectedImpact(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground">
                    {item.expectedImpact || "No expected impact set."}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">JIRA</p>
                  {item.jiraId && !addingJira && (
                    <button
                      type="button"
                      className="text-xs font-medium text-brand-indigo hover:underline"
                      onClick={() => {
                        setJiraIdDraft(item.jiraId ?? "");
                        setAddingJira(true);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
                {item.jiraId && !addingJira ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={item.jiraUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex max-w-full items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-xs break-all text-foreground hover:text-brand-indigo"
                    >
                      {shortJiraId(item.jiraId)}
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                    <button
                      type="button"
                      className="shrink-0 text-xs font-medium text-danger hover:underline"
                      onClick={() => updateWorkItemJira(item.id, null, null)}
                    >
                      Remove
                    </button>
                  </div>
                ) : addingJira ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="PP-1234"
                      value={jiraIdDraft}
                      onChange={(e) => setJiraIdDraft(e.target.value)}
                      className="h-8 w-32"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!jiraIdDraft.trim()) return;
                        const { id, url } = parseJiraInput(jiraIdDraft);
                        updateWorkItemJira(item.id, id, url);
                        setAddingJira(false);
                        setJiraIdDraft("");
                      }}
                    >
                      {item.jiraId ? "Save" : "Add"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddingJira(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex w-fit items-center gap-1 text-xs font-medium text-brand-indigo hover:underline"
                    onClick={() => setAddingJira(true)}
                  >
                    <Plus className="size-3" /> Add JIRA
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">Blocker</p>
                {item.blocked ? (
                  <div className="flex items-start justify-between gap-2 rounded-md bg-danger/10 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-danger" />
                      <p className="text-sm text-danger">{item.blockerDescription}</p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-xs font-medium text-danger hover:underline"
                      onClick={() => toggleWorkItemBlocked(item.id, false)}
                    >
                      Clear
                    </button>
                  </div>
                ) : addingBlocker ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      placeholder="What's blocking this?"
                      value={blockerDraft}
                      onChange={(e) => setBlockerDraft(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (!blockerDraft.trim()) return;
                          toggleWorkItemBlocked(item.id, true, blockerDraft.trim());
                          setAddingBlocker(false);
                          setBlockerDraft("");
                        }}
                      >
                        Mark blocked
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAddingBlocker(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex w-fit items-center gap-1 text-xs font-medium text-danger hover:underline"
                    onClick={() => setAddingBlocker(true)}
                  >
                    <AlertTriangle className="size-3" /> Mark blocked
                  </button>
                )}
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">Activity</p>
                {itemActivity.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No activity yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {itemActivity.map((a) => (
                      <p key={a.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{getProfile(a.userId).name}</span>{" "}
                        {a.action} · {timeAgo(a.createdAt)}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Comments {itemComments.length > 0 && `(${itemComments.length})`}
                </p>
                <div className="flex flex-col gap-3">
                  {itemComments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <Avatar size="sm">
                        <AvatarFallback>{getProfile(c.userId).initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs">
                          <span className="font-medium text-foreground">{getProfile(c.userId).name}</span>{" "}
                          <span className="text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                        </p>
                        <p className="text-sm text-foreground">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <Textarea
                    placeholder="Add a comment…"
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    rows={2}
                  />
                  <Button
                    size="sm"
                    className="self-end"
                    disabled={!commentDraft.trim() || postingComment}
                    onClick={async () => {
                      setPostingComment(true);
                      try {
                        await addComment(item.id, commentDraft.trim());
                        setCommentDraft("");
                        toast.success("Comment added");
                      } catch (error) {
                        toast.error("Couldn't add comment", {
                          description: error instanceof Error ? error.message : undefined,
                        });
                      } finally {
                        setPostingComment(false);
                      }
                    }}
                  >
                    Comment
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Created {formatDueDate(item.createdAt.slice(0, 10))} by {getProfile(item.createdBy).name}
                {item.completedAt && ` · Completed ${formatDueDate(item.completedAt.slice(0, 10))}`}
              </p>
            </div>

            <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete this work item?</DialogTitle>
                  <DialogDescription>
                    &ldquo;{item.title}&rdquo; and its comments will be permanently deleted. This
                    can&apos;t be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline">Cancel</Button>} />
                  <Button
                    variant="destructive"
                    disabled={deleting}
                    onClick={async () => {
                      setDeleting(true);
                      try {
                        await deleteWorkItem(item.id);
                        toast.success("Work item deleted", { description: item.title });
                        setConfirmDeleteOpen(false);
                        onClose();
                      } catch (error) {
                        toast.error("Couldn't delete work item", {
                          description: error instanceof Error ? error.message : undefined,
                        });
                      } finally {
                        setDeleting(false);
                      }
                    }}
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
