"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { WorkspaceSummary } from "@/lib/mock/types";

export function WorkspaceSwitcher({
  currentSlug,
  workspaces,
}: {
  currentSlug: string;
  workspaces: WorkspaceSummary[];
}) {
  const router = useRouter();
  const current = workspaces.find((w) => w.slug === currentSlug);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 text-left text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <span className="truncate">{current?.name ?? "Select workspace"}</span>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-64">
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => router.push(`/app/${ws.slug}`)}
            className={cn("flex items-center justify-between", ws.slug === currentSlug && "font-medium")}
          >
            {ws.name}
            {ws.slug === currentSlug && <Check className="size-4 text-brand-indigo" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/onboarding/workspace")}>
          <Plus className="size-4" />
          Create Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
