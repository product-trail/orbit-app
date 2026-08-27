# Orbit

> Where product work comes together.

Orbit is the operating layer where PM teams manage the product work that
doesn't fit cleanly into JIRA — ideas, initiatives, roadmap, backlog, and
standups, with optional JIRA linking for engineering execution.

## Status

**Phase 1 — Project setup.** This is the scaffold: Next.js, TypeScript,
Tailwind, shadcn/ui, the Orbit design system tokens, and the Supabase client
wiring. Authentication, workspaces, and the rest of the product are built in
subsequent phases (see `AGENTS.md` build history / task tracker for detail).

Visit `/` after running the dev server to see a design-system checkpoint
page (logo, colors, typography, buttons, badges, nav icons) in both light
and dark mode — this is not the final marketing page.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Lucide icons
- **Backend**: Supabase (Postgres, Auth, Row Level Security, Storage)
- **Deployment target**: Vercel (frontend) + Supabase (backend)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase credentials set, the app still runs — auth/session
middleware passes requests through untouched until `NEXT_PUBLIC_SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`.

### Environment variables

See [`.env.example`](./.env.example):

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your
  Supabase project's API settings. Safe to expose to the browser.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, bypasses Row Level Security.
  Never commit a real value or prefix it with `NEXT_PUBLIC_`.

## Project structure

```
src/
  app/                  Next.js App Router routes
  components/
    ui/                 shadcn/ui primitives
    brand/               Orbit logo/symbol
    theme-provider.tsx, theme-toggle.tsx
  lib/
    supabase/           browser / server / admin clients + session middleware
    utils.ts
  types/
    database.ts         Supabase generated types (placeholder until Phase 3)
  proxy.ts               Next.js proxy (session refresh + route protection)
```

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint
```
