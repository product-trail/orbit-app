"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Role } from "@/lib/mock/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Owner/Manager-only action (spec section 30: "Invite members"). No real
 * email backend yet (Phase 1) — this adds the person to the workspace
 * immediately and is upfront that actual email delivery is simulated
 * until authentication (Phase 2) wires up a real invite/email flow.
 */
export function InviteMemberDialog({ trigger }: { trigger?: React.ReactElement }) {
  const { inviteMember } = useWorkspaceData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [submitting, setSubmitting] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = EMAIL_RE.test(normalizedEmail);
  const canSubmit = !!name.trim() && emailValid && !submitting;

  const reset = () => {
    setName("");
    setEmail("");
    setRole("member");
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await inviteMember({ name: name.trim(), email: normalizedEmail, role });
      toast.success("Invite sent", {
        description: `We've emailed an invite to ${normalizedEmail}.`,
      });
      setOpen(false);
      reset();
    } catch (error) {
      toast.error("Couldn't send invite", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" variant="outline">
              <UserPlus className="size-4" />
              Invite member
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            Add them as a workspace member — an invite is sent to their email.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="im-name">Name</Label>
            <Input
              id="im-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Priya Sharma"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="im-email">Email</Label>
            <Input
              id="im-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya.sharma@company.com"
            />
            {email.trim().length > 0 && !emailValid && (
              <p className="text-xs text-danger">Enter a valid email address.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => v && setRole(v as Role)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => (v === "owner" ? "Owner" : "Member")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={submit} disabled={!canSubmit}>
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
