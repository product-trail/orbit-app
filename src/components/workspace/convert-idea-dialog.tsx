"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDaysISO, todayISO } from "@/lib/mock/date-helpers";
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

export function ConvertIdeaDialog({
  ideaId,
  ideaTitle,
  trigger,
  onConverted,
}: {
  ideaId: string;
  ideaTitle: string;
  trigger?: React.ReactElement;
  onConverted?: (initiativeId: string) => void;
}) {
  const { members, getProfile, currentUserId, convertIdeaToInitiative } = useWorkspaceData();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(ideaTitle);
  const [objective, setObjective] = useState("");
  const [ownerId, setOwnerId] = useState(currentUserId);
  const [expectedImpact, setExpectedImpact] = useState("");
  const [metric, setMetric] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [targetDate, setTargetDate] = useState(addDaysISO(90));

  const datesValid = !!startDate && !!targetDate && targetDate >= startDate;

  const submit = async () => {
    if (!name.trim() || !objective.trim() || !expectedImpact.trim() || !datesValid) return;
    setSubmitting(true);
    try {
      const initiative = await convertIdeaToInitiative(ideaId, {
        name: name.trim(),
        objective: objective.trim(),
        ownerId,
        expectedImpact: expectedImpact.trim(),
        metric: metric.trim() || undefined,
        currentValue: currentValue.trim() || undefined,
        targetValue: targetValue.trim() || undefined,
        startDate,
        targetDate,
      });
      toast.success("Converted to initiative", { description: initiative.name });
      setOpen(false);
      onConverted?.(initiative.id);
    } catch (error) {
      toast.error("Couldn't convert idea", {
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
              <ArrowRight className="size-4" />
              Convert to Initiative
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert to initiative</DialogTitle>
          <DialogDescription>
            Turn this idea into a tracked initiative with an owner and success metric.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ci-name">Name</Label>
            <Input id="ci-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ci-objective">Objective</Label>
            <Textarea
              id="ci-objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="What is this initiative trying to achieve?"
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ci-impact">Expected impact</Label>
            <Textarea
              id="ci-impact"
              value={expectedImpact}
              onChange={(e) => setExpectedImpact(e.target.value)}
              placeholder="What changes if this succeeds?"
              rows={2}
            />
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

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ci-metric">Metric</Label>
              <Input
                id="ci-metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                placeholder="Activation rate"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ci-current">Current</Label>
              <Input
                id="ci-current"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="32%"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ci-target">Target</Label>
              <Input
                id="ci-target"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="50%"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ci-start">Start date</Label>
              <Input
                id="ci-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ci-target-date">Target date</Label>
              <Input
                id="ci-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>
          {!datesValid && (
            <p className="text-xs text-danger">Target date must be on or after the start date.</p>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button
            onClick={submit}
            disabled={
              !name.trim() || !objective.trim() || !expectedImpact.trim() || !datesValid || submitting
            }
          >
            {submitting ? "Converting…" : "Convert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
