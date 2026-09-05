"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BIZ_COLUMN_KEYS, DEFAULT_BIZ_COLUMN_LABELS } from "@/lib/business-prioritization";
import { cn } from "@/lib/utils";
import type { CustomFieldType } from "@/lib/mock/types";

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
};

export default function SettingsPage() {
  const {
    workspace,
    members,
    getProfile,
    currentUserId,
    currentRole,
    removeMember,
    businessPrioritizationFields,
    updateWorkspaceColumnLabel,
    addBusinessPrioritizationField,
    removeBusinessPrioritizationField,
  } = useWorkspaceData();
  const isOwner = currentRole === "owner";

  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>("text");
  const [addingField, setAddingField] = useState(false);

  const columnLabels = { ...DEFAULT_BIZ_COLUMN_LABELS, ...workspace.settings.businessPrioritizationLabels };

  async function handleAddField() {
    const label = newFieldLabel.trim();
    if (!label) return;
    setAddingField(true);
    try {
      await addBusinessPrioritizationField({ label, type: newFieldType });
      setNewFieldLabel("");
      setNewFieldType("text");
    } catch (error) {
      toast.error("Couldn't add column", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setAddingField(false);
    }
  }

  async function handleRemoveField(id: string, label: string) {
    try {
      await removeBusinessPrioritizationField(id);
    } catch (error) {
      toast.error(`Couldn't remove "${label}"`, {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

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
        <CardHeader>
          <CardTitle>Business Prioritization Columns</CardTitle>
          <CardDescription>
            Relabel the built-in columns or add your own for this workspace&apos;s Business Prioritization
            view. These defaults were written for one team&apos;s use case, so other teams can adjust them
            here.
            {!isOwner && " Only owners can make changes."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            {BIZ_COLUMN_KEYS.map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={`col-${key}`}>{DEFAULT_BIZ_COLUMN_LABELS[key]} column label</Label>
                <Input
                  id={`col-${key}`}
                  defaultValue={columnLabels[key]}
                  disabled={!isOwner}
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    if (value && value !== columnLabels[key]) updateWorkspaceColumnLabel(key, value);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground">Custom columns</p>
            {businessPrioritizationFields.length === 0 ? (
              <p className="text-xs text-muted-foreground">No custom columns yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {businessPrioritizationFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between gap-3 py-2 first:pt-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{field.label}</span>
                      <span className="inline-flex w-fit items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                        {FIELD_TYPE_LABELS[field.type]}
                      </span>
                    </div>
                    {isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => handleRemoveField(field.id, field.label)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isOwner && (
            <div className="flex items-end gap-2 border-t border-border pt-4">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="new-field-label">Add column</Label>
                <Input
                  id="new-field-label"
                  placeholder="Column name"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                />
              </div>
              <div className="flex w-32 flex-col gap-1.5">
                <Select
                  value={newFieldType}
                  onValueChange={(v) => v && setNewFieldType(v as CustomFieldType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => FIELD_TYPE_LABELS[v as CustomFieldType]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddField} disabled={!newFieldLabel.trim() || addingField}>
                Add
              </Button>
            </div>
          )}
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
