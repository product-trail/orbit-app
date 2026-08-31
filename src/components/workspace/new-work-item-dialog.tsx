"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { PRIORITIES } from "@/components/workspace/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Impact, WorkType } from "@/lib/mock/types";

const WORK_TYPES: WorkType[] = [
  "Task",
  "Analysis",
  "PRD",
  "Experiment",
  "Stakeholder",
  "Launch",
  "Review",
  "Other",
];
const IMPACTS: Impact[] = ["High", "Medium", "Low"];
const NO_INITIATIVE = "none";

export function NewWorkItemDialog({
  trigger,
  defaultOwnerId,
  initiativeId,
  initialTitle,
  initialDescription,
}: {
  trigger?: React.ReactElement;
  defaultOwnerId?: string;
  initiativeId?: string;
  /** Pre-fills the title, e.g. with the parent initiative's name. */
  initialTitle?: string;
  /** Pre-fills the description, e.g. with the parent initiative's objective. */
  initialDescription?: string;
}) {
  const { members, getProfile, currentUserId, createWorkItem, initiatives } = useWorkspaceData();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [type, setType] = useState<WorkType>("Task");
  const [priority, setPriority] = useState<"P0" | "P1" | "P2" | "P3">("P2");
  const [impact, setImpact] = useState<Impact>("Medium");
  const [ownerId, setOwnerId] = useState(defaultOwnerId ?? currentUserId);
  const [dueDate, setDueDate] = useState("");
  const [selectedInitiativeId, setSelectedInitiativeId] = useState(NO_INITIATIVE);
  const [expectedImpact, setExpectedImpact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // When this dialog is opened from within an initiative's own page,
  // `initiativeId` is passed in and the link is fixed — no picker needed.
  // Otherwise (global backlog / team page), let the user pick one.
  const showInitiativePicker = !initiativeId;

  const reset = () => {
    setTitle(initialTitle ?? "");
    setDescription(initialDescription ?? "");
    setType("Task");
    setPriority("P2");
    setImpact("Medium");
    setOwnerId(defaultOwnerId ?? currentUserId);
    setDueDate("");
    setSelectedInitiativeId(NO_INITIATIVE);
    setExpectedImpact("");
  };

  const submit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await createWorkItem({
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        impact,
        ownerId,
        dueDate: dueDate || null,
        initiativeId: initiativeId ?? (selectedInitiativeId === NO_INITIATIVE ? undefined : selectedInitiativeId),
        expectedImpact: expectedImpact.trim() || undefined,
      });
      toast.success("Work item created", { description: title.trim() });
      setOpen(false);
      reset();
    } catch (error) {
      toast.error("Couldn't create work item", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm">
              <Plus className="size-4" />
              New
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New work item</DialogTitle>
          <DialogDescription>
            Create product work - it doesn&apos;t need a JIRA ticket.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wi-title">Title</Label>
            <Input
              id="wi-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Analyse Postpaid funnel drop"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wi-description">Description</Label>
            <Textarea
              id="wi-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to happen here?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as WorkType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Owner</Label>
              <Select value={ownerId} onValueChange={(v) => v && setOwnerId(v)}>
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
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Impact</Label>
              <Select value={impact} onValueChange={(v) => setImpact(v as Impact)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMPACTS.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="wi-due">Due date</Label>
              <Input
                id="wi-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {showInitiativePicker && (
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Initiative</Label>
                <Select value={selectedInitiativeId} onValueChange={(v) => v && setSelectedInitiativeId(v)}>
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
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wi-expected-impact">Expected impact (optional)</Label>
            <Textarea
              id="wi-expected-impact"
              value={expectedImpact}
              onChange={(e) => setExpectedImpact(e.target.value)}
              placeholder="e.g. Increase landing page conversion by 2%"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={submit} disabled={!title.trim() || submitting}>
            {submitting ? "Creating…" : "Create work item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
