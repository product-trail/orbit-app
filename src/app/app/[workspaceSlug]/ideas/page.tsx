"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Lightbulb, Search } from "lucide-react";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { IdeaStatusBadge } from "@/components/workspace/badges";
import { NewIdeaDialog } from "@/components/workspace/new-idea-dialog";
import { IdeaPanel } from "@/components/workspace/idea-panel";
import { EmptyState } from "@/components/workspace/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDueDate } from "@/lib/mock/date-helpers";
import type { IdeaStatus, Impact } from "@/lib/mock/types";

const ALL = "all";
const IDEA_STATUSES: IdeaStatus[] = ["Captured", "Exploring", "Validated", "Rejected", "Converted"];
const IMPACTS: Impact[] = ["High", "Medium", "Low"];

export default function IdeasPage() {
  const { ideas, getProfile } = useWorkspaceData();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("item"));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [impactFilter, setImpactFilter] = useState(ALL);

  const filtered = useMemo(() => {
    return ideas.filter((idea) => {
      if (search && !idea.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== ALL && idea.status !== statusFilter) return false;
      if (impactFilter !== ALL && idea.impact !== impactFilter) return false;
      return true;
    });
  }, [ideas, search, statusFilter, impactFilter]);

  const hasAnyIdeas = ideas.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ideas</h1>
          <p className="text-sm text-muted-foreground">
            Capture raw ideas, then turn the promising ones into initiatives.
          </p>
        </div>
        <NewIdeaDialog />
      </div>

      {!hasAnyIdeas ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas yet"
          description="Capture your first idea — it doesn't need to be fully formed yet."
          action={<NewIdeaDialog trigger={<Button size="sm">+ New Idea</Button>} />}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search ideas…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? ALL)}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Status">
                  {(v: string) => (v === ALL ? "All statuses" : v)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {IDEA_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={impactFilter} onValueChange={(v) => setImpactFilter(v ?? ALL)}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Impact">
                  {(v: string) => (v === ALL ? "All impact" : v)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All impact</SelectItem>
                {IMPACTS.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching ideas"
              description="Try clearing a filter or searching a different term."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((idea) => (
                <Card
                  key={idea.id}
                  className="cursor-pointer transition-colors hover:border-brand-indigo/40"
                  onClick={() => setSelectedId(idea.id)}
                >
                  <CardContent className="flex flex-col gap-3 pt-6">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{idea.title}</p>
                      <IdeaStatusBadge status={idea.status} />
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{idea.problem}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Avatar size="sm">
                          <AvatarFallback>{getProfile(idea.createdBy).initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {getProfile(idea.createdBy).name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDueDate(idea.createdAt.slice(0, 10))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <IdeaPanel
        ideaId={selectedId}
        onClose={() => setSelectedId(null)}
        onOpenInitiative={(initiativeId) => {
          setSelectedId(null);
          router.push(`/app/${workspaceSlug}/roadmap?item=${initiativeId}`);
        }}
      />
    </div>
  );
}
