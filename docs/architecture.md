# TeamUp — Architecture Overview

## System Overview

TeamUp is a Next.js 14 full-stack application using Supabase for auth/storage/real-time and PostgreSQL (via Prisma) for all relational data.

```
Browser
  │
  ├─ Next.js App Router (Vercel)
  │    ├─ Server Components (SSR)
  │    ├─ Client Components ("use client")
  │    ├─ API Route Handlers (/app/api/)
  │    └─ Middleware (auth guard)
  │
  ├─ Supabase Auth  (Google OAuth + email/password)
  ├─ Supabase Storage  (private bucket: resumes/)
  ├─ Supabase Real-time  (Phase 4: notification subscriptions)
  │
  └─ PostgreSQL (Supabase)
       └─ Prisma ORM
```

## Folder Structure

```
teamup/
  src/
    app/
      (auth)/login/          # /login page (client)
      (auth)/signup/         # /signup page (client) — Devfolio-style dual path
      (app)/dashboard/       # /dashboard (server)
      (app)/teams/           # /teams/* (browse, create, detail) — Phase 2+
      (app)/profile/         # /profile (Phase 1+)
      (app)/requests/        # /requests (Phase 3+)
      (app)/notifications/   # /notifications (Phase 4+)
      api/
        auth/signout/        # POST — sign out
        users/profile/       # GET/POST — own profile
        teams/               # GET/POST — Phase 2+
        join-requests/       # GET/POST — Phase 3+
        notifications/       # GET — Phase 4+
      auth/callback/         # OAuth code exchange
      auth/error/            # Auth error page
      page.tsx               # Landing page
      layout.tsx             # Root layout
      globals.css            # Design system
    lib/
      supabase/
        client.ts            # Browser client (Client Components)
        server.ts            # Server client (Server Components, Route Handlers)
      prisma.ts              # Singleton PrismaClient
    middleware.ts            # NFR6: no anonymous access guard

  prisma/
    schema.prisma            # Full data model
    sql/
      add_pending_request_unique_index.sql  # GAP-RESOLVED-5

  docs/
    architecture.md          # This file
    api.md                   # API endpoint docs
    design/                  # Per-phase design notes
```

## Data Model Summary

See `prisma/schema.prisma` for the full schema. Key models:

| Model | Purpose |
|---|---|
| `User` | Auth + profile. Self-reported gender drives the SIH female quota flag. |
| `Event` | Configurable hackathon (SIH 2026 seed data) |
| `Team` | A team with leader, skills, vacancy tracking |
| `TeamMembership` | Join table with role (leader/member) |
| `JoinRequest` | A request in either direction (user_to_team or team_to_user) |
| `JoinRequestOpinion` | Advisory team-member opinions on a request |
| `Notification` | All notification types (JSON payload) |

## Auth Flow

```
User visits any page
  └─ middleware.ts checks Supabase session
       ├─ No session → redirect /login (NFR6)
       └─ Session exists → proceed

Login page:
  Option A: Google OAuth → /auth/callback → session → /dashboard
  Option B: Email+password → signInWithPassword → /dashboard

Signup page:
  Step 1: Choose path (Join / Create) — Devfolio-style
  Step 2: Google OAuth OR email+password + profile form
    → POST /api/users/profile (creates Prisma User record)
    → redirect /dashboard or /teams/create
```

## Semi-Transparency Access Control

Implemented as explicit field selection in each API handler — never scattered ad-hoc.

| Caller | What they see |
|---|---|
| Any logged-in user | Team structure, leader name+contact, existing members name/dept/skills |
| Team member (viewing pending request) | Requester's live User record (GAP-RESOLVED-3: no snapshot) |
| Leader (reviewing request) | Same as team member + aggregated opinions |
| Nobody | Non-leader contact info (until member joins) |

## Key Design Decisions (GAP-RESOLVED markers)

| # | Decision |
|---|---|
| 1 | Creator auto-gets `TeamMembership.role = leader`. Manual transfer from Phase 3+. |
| 2 | Gender: binary `male`/`female`. Only `female` counts toward `min_female_required`. |
| 3 | No profile snapshot in JoinRequest — team always reads live User record. |
| 4 | Cascade-expiry covers both directions (user_to_team and team_to_user). |
| 5 | Partial unique DB index on `(team_id, requester_id) WHERE status='pending'`. |
| 6 | Identity verification (OCR/ID-card) removed. Self-reported gender counts directly toward the female quota. |
| 7 | The phone number collected at signup is the informal identity signal (closed, single-college user base). |
| 8 | `auto_promote` algorithm: TBD before Phase 5. |
| 9 | Test tooling: `next-test-api-route-handler` replaces Supertest. |
