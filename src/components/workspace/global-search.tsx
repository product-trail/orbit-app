"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/**
 * Workspace-scoped global search (spec section 50): work items, ideas,
 * initiatives, and JIRA IDs. Cmd/Ctrl+K opens it from anywhere in the app.
 */
export function GlobalSearch({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { workItems, ideas, initiatives } = useWorkspaceData();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Icon-only trigger on small screens so the search control doesn't
          crowd out the workspace name / logo in the header; the full
          labeled bar only appears from `sm:` up where there's room. */}
      <Button
        variant="outline"
        size="icon"
        aria-label="Search Orbits"
        className="shrink-0 text-muted-foreground sm:hidden"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
      </Button>
      <Button
        variant="outline"
        className="hidden w-56 justify-start gap-2 text-muted-foreground sm:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search Orbits</span>
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search work, ideas, initiatives, JIRA IDs…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Work Items">
            {workItems.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.jiraId ?? ""}`}
                onSelect={() => go(`/app/${slug}/work?item=${item.id}`)}
              >
                {item.title}
                {item.jiraId && (
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {item.jiraId}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Ideas">
            {ideas.map((idea) => (
              <CommandItem
                key={idea.id}
                value={idea.title}
                onSelect={() => go(`/app/${slug}/ideas?idea=${idea.id}`)}
              >
                {idea.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Initiatives">
            {initiatives.map((initiative) => (
              <CommandItem
                key={initiative.id}
                value={initiative.name}
                onSelect={() => go(`/app/${slug}/roadmap?initiative=${initiative.id}`)}
              >
                {initiative.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
