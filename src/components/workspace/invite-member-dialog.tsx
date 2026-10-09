"use client";

import { useState } from "react";
import { UserPlus, Copy, Check } from "lucide-react";
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

type Credentials = { email: string; password: string };

/**
 * Owner/Manager-only action (spec section 30: "Invite members"). No invite
 * email is sent - account creation depends on Supabase's confirmation-email
 * redirect, which needs dashboard config outside the app's control and kept
 * breaking for invitees. Instead this creates the account outright with a
 * system-generated password and shows it on screen so the owner can share it
 * directly (WhatsApp, email, copy/paste). The new member can change that
 * password any time from the login page's "Change password" option.
 */
export function InviteMemberDialog({ trigger }: { trigger?: React.ReactElement }) {
  const { inviteMember } = useWorkspaceData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = EMAIL_RE.test(normalizedEmail);
  const canSubmit = !!name.trim() && emailValid && !submitting;

  const reset = () => {
    setName("");
    setEmail("");
    setRole("member");
    setCredentials(null);
    setCopied(false);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await inviteMember({ name: name.trim(), email: normalizedEmail, role });
      if (result.mode === "invited" && result.password) {
        setCredentials({ email: result.email, password: result.password });
      } else {
        toast.success("Member added", {
          description: `${result.email} already had an account and was added to the workspace.`,
        });
        setOpen(false);
        reset();
      }
    } catch (error) {
      toast.error("Couldn't add member", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const credentialsText = credentials
    ? `You've been added to Orbit!\n\nLogin: https://app.myorbits.in/login\nEmail: ${credentials.email}\nPassword: ${credentials.password}\n\nYou can change your password any time from the login page.`
    : "";

  const copyCredentials = async () => {
    await navigator.clipboard.writeText(credentialsText);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
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
        {credentials ? (
          <>
            <DialogHeader>
              <DialogTitle>Member added</DialogTitle>
              <DialogDescription>
                Share these credentials with {name.trim() || "them"} directly - no email was sent.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input readOnly value={credentials.email} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Password</Label>
                <Input readOnly value={credentials.password} className="font-mono" />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={copyCredentials}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  Copy credentials
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(credentialsText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Share via WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={`mailto:${credentials.email}?subject=${encodeURIComponent(
                        "Your Orbit login",
                      )}&body=${encodeURIComponent(credentialsText)}`}
                    />
                  }
                >
                  Share via email
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite a team member</DialogTitle>
              <DialogDescription>
                Add them as a workspace member - you&apos;ll get a password to share with them directly.
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
                {submitting ? "Adding…" : "Send invite"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
