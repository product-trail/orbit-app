"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { OrbitSymbol } from "@/components/brand/orbit-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
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
  // Exact match only — sub-route prefix matching would make "Home" (whose
  // href is just the workspace root, e.g. /app/acme) match every other
  // page nested under that same root, highlighting it everywhere.
  const active = href === pathname;

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

function MobileNavLink({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const active = href === pathname;

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="w-full truncate text-center">{label}</span>
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
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-sidebar-border bg-sidebar px-3 py-4 md:flex">
        <div className="flex items-center gap-2 px-1.5">
          <OrbitSymbol size={30} />
          <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
            Orbits
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

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {/* The sidebar (which normally carries the Orbits mark) is
                hidden below `md:`, so surface the mark here on mobile
                instead of leaving the header unbranded. */}
            <OrbitSymbol size={24} className="shrink-0 md:hidden" />
            <p className="truncate text-sm font-semibold text-foreground">{workspace.name}</p>
          </div>
          <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
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

        <main className="flex-1 bg-background pb-24 md:pb-0">{children}</main>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-between gap-0.5 rounded-2xl border border-sidebar-border bg-sidebar px-1.5 py-2 shadow-lg md:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <MobileNavLink
            key={item.label}
            href={item.href(slug)}
            label={item.mobileLabel ?? item.label}
            Icon={item.icon}
          />
        ))}
      </nav>
    </div>
  );
}
