import Link from "next/link";
import {
  Bell,
  Columns3,
  Flag,
  Home,
  Lightbulb,
  List,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { OrbitLogo, OrbitSymbol } from "@/components/brand/orbit-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "Home", icon: Home },
  { label: "My Work", icon: List },
  { label: "Product Backlog", icon: Columns3 },
  { label: "Ideas", icon: Lightbulb },
  { label: "Roadmap", icon: Flag },
  { label: "Team", icon: Users },
];

const statuses = [
  { label: "Backlog", className: "bg-muted text-muted-foreground" },
  { label: "In PRD", className: "bg-accent text-accent-foreground" },
  { label: "In Development", className: "bg-info/10 text-info" },
  { label: "Completed", className: "bg-success/10 text-success" },
];

const priorities = [
  { label: "P0", className: "bg-danger/10 text-danger" },
  { label: "P1", className: "bg-warning/10 text-warning" },
  { label: "P2", className: "bg-info/10 text-info" },
  { label: "P3", className: "bg-muted text-muted-foreground" },
];

/**
 * Phase 1 scaffold check: this page is a design-system smoke test, not the
 * final marketing landing page (that's a separate later build item). It
 * exists to visually verify Orbit's tokens, typography, and shadcn
 * component wiring render correctly in both themes before Phase 2 (auth).
 */
export default function DesignPreviewPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <OrbitLogo />
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-[10px]">
            Phase 1 — Project Setup
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-6 py-12">
        <section className="flex flex-col gap-3">
          <p className="text-sm font-medium text-primary">Orbit</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Where product work comes together.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            The operating layer for product teams to manage the work that
            doesn&apos;t fit cleanly into JIRA. This screen is a design-system
            checkpoint for Phase 1 — real product screens start in Phase 2.
          </p>
          <div className="mt-2 flex gap-3">
            <Button>Primary action</Button>
            <Button variant="outline">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </section>

        <Separator />

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <OrbitSymbol size={18} />
                Dashboard card
              </CardTitle>
              <CardDescription>
                Structured cards with soft borders, per the Orbit dashboard
                visual language.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-foreground">12</div>
              <div className="text-sm text-muted-foreground">
                Active work
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status &amp; priority</CardTitle>
              <CardDescription>
                Semantic color usage — subtle backgrounds, not overpowering.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <span
                    key={s.label}
                    className={`rounded-md px-2 py-1 text-xs font-medium ${s.className}`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {priorities.map((p) => (
                  <span
                    key={p.label}
                    className={`rounded-md px-2 py-1 text-xs font-medium ${p.className}`}
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Navigation icon set
          </h2>
          <div className="flex flex-wrap gap-2">
            {navItems.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground"
              >
                <Icon className="size-4 text-muted-foreground" />
                {label}
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground">
              <Search className="size-4 text-muted-foreground" />
              Search
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground">
              <Bell className="size-4 text-muted-foreground" />
              Notifications
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground">
              <Settings className="size-4 text-muted-foreground" />
              Settings
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
        Orbit —{" "}
        <Link href="https://nextjs.org" className="underline">
          Next.js
        </Link>{" "}
        + Supabase scaffold. Ready for Phase 2 (Authentication).
      </footer>
    </div>
  );
}
