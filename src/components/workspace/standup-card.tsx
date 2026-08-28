import { Check, ArrowRight, AlertTriangle } from "lucide-react";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { Standup } from "@/lib/mock/types";

export function StandupCard({ standup }: { standup: Standup }) {
  const { getProfile } = useWorkspaceData();
  const profile = getProfile(standup.userId);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{profile.initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-foreground">{profile.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StandupSection label="Yesterday" items={standup.yesterday} icon={Check} tone="text-success" empty="Nothing logged" />
          <StandupSection label="Today" items={standup.today} icon={ArrowRight} tone="text-brand-indigo" empty="Nothing planned" />
          <StandupSection label="Blocked" items={standup.blocked} icon={AlertTriangle} tone="text-danger" empty="Nothing blocked" />
        </div>
      </CardContent>
    </Card>
  );
}

function StandupSection({
  label,
  items,
  icon: Icon,
  tone,
  empty,
}: {
  label: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  empty: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5 text-sm text-foreground">
              <Icon className={`mt-0.5 size-3.5 shrink-0 ${tone}`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
