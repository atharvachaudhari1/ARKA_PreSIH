# TeamUp — README

## Overview

**TeamUp** is a verified, semi-anonymous teammate-matching platform for Smart India Hackathon (SIH). It replaces chaotic WhatsApp group broadcasts with a structured, privacy-respecting platform where teams and individuals find each other.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API Route Handlers |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Storage | Supabase Storage (private bucket) |
| Testing | Jest + React Testing Library + next-test-api-route-handler |

## Getting Started

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 2. Clone & install

```bash
git clone <repo-url>
cd teamup
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase credentials:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key |
| `DATABASE_URL` | Supabase Dashboard → Settings → Database → Transaction pooler connection string (port 6543) |
| `DIRECT_URL` | Supabase Dashboard → Settings → Database → Direct connection string (port 5432) |

### 4. Set up the database

```bash
# Generate and run Prisma migrations
npx prisma migrate dev --name init

# Apply the partial unique index (GAP-RESOLVED-5)
npx prisma db execute --file prisma/sql/add_pending_request_unique_index.sql

# Generate Prisma client
npx prisma generate
```

### 5. Set up Supabase Storage bucket

In your Supabase dashboard → Storage → New bucket:
- **Name**: `id-cards`
- **Public**: off (must be private — GAP-RESOLVED-6)
- No public policies. The bucket is only accessed by the service role.

### 6. Enable Google OAuth in Supabase

Supabase Dashboard → Authentication → Providers → Google:
- Enable Google provider
- Add your Google OAuth client ID + secret
- Add `http://localhost:3000/auth/callback` to allowed redirect URLs

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build production bundle |
| `npm run lint` | Run ESLint |
| `npm test` | Run all tests |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Create and apply a new migration |

## Project Structure

```
src/
  app/
    (auth)/           # Auth routes: /login, /signup
    (app)/            # Protected app routes: /dashboard, /teams, /profile, ...
    api/              # API Route Handlers
    auth/callback/    # Supabase OAuth callback
    auth/error/       # Auth error page
    page.tsx          # Landing page (/)
    layout.tsx        # Root layout
    globals.css       # Design system CSS
  lib/
    supabase/
      client.ts       # Browser Supabase client
      server.ts       # Server Supabase client
    prisma.ts         # Prisma singleton
  middleware.ts       # Auth middleware (NFR6: no anonymous access)
prisma/
  schema.prisma       # Full data model
  sql/
    add_pending_request_unique_index.sql  # GAP-RESOLVED-5
docs/
  architecture.md
  api.md
  design/
```

## Security Notes

- **No anonymous access anywhere** (NFR6) — enforced at middleware level.
- **College ID card images** are stored in a private Supabase Storage bucket and are never returned by any API response (GAP-RESOLVED-6). Only the automated OCR/AI verification pipeline accesses them.
- **Semi-transparency** access control is enforced at the API layer.
- Leader contact info is forced `public_to_logged_in` while they hold the leader role.

## Build Phases

See `../ANTIGRAVITY_BUILD_GUIDE.md` for the full phased build plan.
Current status: **Phase 0 complete**.

## Admin Setup
1. Set ADMIN_EMAIL in your .env file.
2. Run `npx prisma db seed` to securely provision the admin account directly in Supabase Auth and the database.
3. Run 
px prisma db seed to grant admin privileges to that user.
