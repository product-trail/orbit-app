import { notFound } from "next/navigation";
import { getAdminAnalytics } from "@/lib/data/admin-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { timeAgo } from "@/lib/mock/date-helpers";

// Analytics change on every request (signups, activity) — never serve a
// cached/stale snapshot of this page.
export const dynamic = "force-dynamic";

/**
 * Founder-only product analytics: signups + cross-workspace activity.
 * Not linked anywhere in the app nav — reached only by typing /admin
 * directly, and even then gated to an allow-listed email (ADMIN_EMAILS env
 * var) rather than any in-app role. Anyone else gets the same 404 as a
 * route that doesn't exist, both signed out and signed in as a regular user.
 */
export default async function AdminAnalyticsPage() {
  const data = await getAdminAnalytics();
  if (!data) notFound();

  const maxDaily = Math.max(1, ...data.dailyActivity.map((d) => d.count));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Orbit Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {data.viewerEmail} — this view isn&apos;t linked anywhere in the app.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Total signups", value: data.totals.signups },
          { label: "Workspaces", value: data.totals.workspaces },
          { label: "Active today", value: data.totals.activeToday },
          { label: "Active this week", value: data.totals.activeThisWeek },
          { label: "Active this month", value: data.totals.activeThisMonth },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col gap-1 pt-6">
              <span className="text-2xl font-semibold text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity — last 14 days</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-1.5 pt-2 pb-6" style={{ height: 120 }}>
          {data.dailyActivity.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5" title={`${d.date}: ${d.count}`}>
              <div
                className="w-full rounded-t-sm bg-brand-indigo opacity-80"
                style={{ height: `${Math.max((d.count / maxDaily) * 88, d.count > 0 ? 4 : 1)}px` }}
              />
              <span className="text-[9px] text-muted-foreground">{d.date.slice(5)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-2">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Work items</TableHead>
                <TableHead>Ideas</TableHead>
                <TableHead>Initiatives</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.workspaces.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium text-foreground">{w.name}</TableCell>
                  <TableCell className="text-muted-foreground">{w.memberCount}</TableCell>
                  <TableCell className="text-muted-foreground">{w.workItemCount}</TableCell>
                  <TableCell className="text-muted-foreground">{w.ideaCount}</TableCell>
                  <TableCell className="text-muted-foreground">{w.initiativeCount}</TableCell>
                  <TableCell className="text-muted-foreground">{timeAgo(w.createdAt)}</TableCell>
                </TableRow>
              ))}
              {data.workspaces.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No workspaces yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent signups</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-2">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Signed up</TableHead>
                <TableHead>Last login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentSignups.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{timeAgo(s.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.lastSignInAt ? timeAgo(s.lastSignInAt) : "Never"}
                  </TableCell>
                </TableRow>
              ))}
              {data.recentSignups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No signups yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
