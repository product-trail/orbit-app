"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrbitLogo } from "@/components/brand/orbit-logo";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "workspace"
  );
}

/**
 * Post-signup onboarding (spec section 27): every new account needs at least
 * one workspace before they can see any product UI. Backed by the
 * create_workspace_with_owner RPC (migration 0003), which atomically creates
 * the workspace row and the caller's 'owner' membership row.
 */
export default function CreateWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const supabase = createClient();
    const baseSlug = slugify(trimmed);

    let lastError: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      const { data, error } = await supabase.rpc("create_workspace_with_owner", {
        p_name: trimmed,
        p_slug: slug,
      });

      if (!error && data) {
        toast.success("Workspace created", { description: trimmed });
        router.push(`/app/${data.slug}`);
        return;
      }

      // 23505 = unique_violation on the slug column — try the next candidate.
      if (error?.code === "23505") {
        lastError = error.message;
        continue;
      }

      lastError = error?.message ?? "Something went wrong creating your workspace.";
      break;
    }

    setSubmitting(false);
    toast.error("Couldn't create workspace", { description: lastError ?? undefined });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <OrbitLogo />
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Create your workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              This is where your team&apos;s work, ideas, and roadmap will live.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Postpaid Product Team"
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full" disabled={!name.trim() || submitting}>
            {submitting ? "Creating…" : "Create workspace"}
          </Button>
        </form>
      </div>
    </div>
  );
}
