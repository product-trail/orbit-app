"use client";

import { toast } from "sonner";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { workspace, members, getProfile, currentUserId, currentRole, removeMember } =
    useWorkspaceData();
  const isOwner = currentRole === "owner";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage this workspace and its members.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Basic details for this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ws-name">Name</Label>
              <Input id="ws-name" defaultValue={workspace.name} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ws-slug">Slug</Label>
              <Input id="ws-slug" defaultValue={workspace.slug} disabled />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Workspace editing arrives with authentication (Phase 2).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {members.length} people in this workspace.
              {!isOwner && " Only owners can invite or remove members."}
            </CardDescription>
          </div>
          {isOwner && <InviteMemberDialog />}
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border pt-0">
          {members.map((m) => {
            const profile = getProfile(m.userId);
            const isMe = m.userId === currentUserId;
            return (
              <div key={m.userId} className="flex items-center justify-between gap-3 py-3 first:pt-4">
                <div className="flex items-center gap-2.5">
                  <Avatar size="sm">
                    <AvatarFallback>{profile.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {profile.name}
                      {isMe && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex w-fit items-center rounded-md px-2 py-1 text-xs font-medium capitalize",
                      m.role === "owner"
                        ? "bg-brand-indigo/10 text-brand-indigo"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {m.role}
                  </span>
                  {!isMe && isOwner && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={async () => {
                        try {
                          await removeMember(m.userId);
                          toast.success("Member removed", { description: profile.name });
                        } catch (error) {
                          toast.error("Couldn't remove member", {
                            description: error instanceof Error ? error.message : undefined,
                          });
                        }
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
