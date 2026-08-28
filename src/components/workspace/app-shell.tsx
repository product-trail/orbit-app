"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { OrbitSymbol } from "@/components/brand/orbit-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { GlobalSearch } from "@/components/workspace/global-search";
import { useWorkspaceData } from "@/components/workspace/workspace-data-provider";
import { NAV_ITEMS, SETTINGS_ITEM } from "@/components/workspace/nav-config";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { WorkspaceSummary } from "@/lib/mock/types";

function NavLink({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const active = href === pathname || (href.length > 1 && pathname?.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

export function AppShell({
  slug,
  workspaces,
  children,
}: {
  slug: string;
  workspaces: WorkspaceSummary[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { workspace, currentUserId, currentRole, getProfile } = useWorkspaceData();
  const me = getProfile(currentUserId);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar px-3 py-4">
        <div className="flex items-center gap-2 px-1.5">
          <OrbitSymbol size={22} />
          <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
            Orbit
          </span>
        </div>

        <WorkspaceSwitcher currentSlug={slug} workspaces={workspaces} />

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.label} href={item.href(slug)} label={item.label} Icon={item.icon} />
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-sidebar-border pt-3">
          <NavLink
            href={SETTINGS_ITEM.href(slug)}
            label={SETTINGS_ITEM.label}
            Icon={SETTINGS_ITEM.icon}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{workspace.name}</p>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            <GlobalSearch slug={slug} />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() =>
                toast.info("No new notifications", {
                  description: "In-app notifications arrive later in the build.",
                })
              }
            >
              <Bell className="size-4" />
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button type="button" className="rounded-full">
                    <Avatar size="sm">
                      <AvatarFallback>{me.initials}</AvatarFallback>
                    </Avatar>
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    Signed in as {me.name}
                    <span className="ml-1 font-normal capitalize text-muted-foreground">
                      · {currentRole}
                    </span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
