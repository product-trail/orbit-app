"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
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
import type { Impact } from "@/lib/mock/types";

const IMPACTS: Impact[] = ["High", "Medium", "Low"];

export function NewIdeaDialog({ trigger }: { trigger?: React.ReactElement }) {
  const { createIdea } = useWorkspaceData();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState<Impact>("Medium");
  const [productArea, setProductArea] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setProblem("");
    setDescription("");
    setImpact("Medium");
    setProductArea("");
  };

  const submit = async () => {
    if (!title.trim() || !problem.trim()) return;
    setSubmitting(true);
    try {
      await createIdea({
        title: title.trim(),
        problem: problem.trim(),
        description: description.trim(),
        impact,
        productArea: productArea.trim() || undefined,
      });
      toast.success("Idea captured", { description: title.trim() });
      setOpen(false);
      reset();
    } catch (error) {
      toast.error("Couldn't capture idea", {
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
              New Idea
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New idea</DialogTitle>
          <DialogDescription>Capture a raw idea before it becomes real work.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idea-title">Title</Label>
            <Input
              id="idea-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Self-serve plan upgrade flow"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idea-problem">Problem</Label>
            <Textarea
              id="idea-problem"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="What problem does this solve?"
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idea-description">Description</Label>
            <Textarea
              id="idea-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sketch out the idea in a bit more detail"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Impact</Label>
              <Select value={impact} onValueChange={(v) => v && setImpact(v as Impact)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMPACTS.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="idea-area">Product area</Label>
              <Input
                id="idea-area"
                value={productArea}
                onChange={(e) => setProductArea(e.target.value)}
                placeholder="Billing"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={submit} disabled={!title.trim() || !problem.trim() || submitting}>
            {submitting ? "Capturing…" : "Capture idea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
