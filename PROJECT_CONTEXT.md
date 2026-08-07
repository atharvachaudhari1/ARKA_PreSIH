# TeamUp

## What this app does
TeamUp is a platform designed to help participants (hackers) find and form teams for hackathons (e.g., Smart India Hackathon). It allows users to create profiles, build teams with specific skill and quota requirements, browse and request to join other teams. Identity verification (OCR/ID-card) was fully removed — self-reported profile info, including gender for the SIH female quota, is trusted as-is for a single college's own students.

## Tech stack
- **Frontend Framework**: Next.js (App Router), React 19
- **Styling & UI**: Tailwind CSS v4, Lucide React (icons)
- **Backend/API Layer**: Next.js API Routes (`src/app/api/...`)
- **Database**: PostgreSQL (hosted on Supabase), managed via Prisma ORM (`@prisma/client`, `@prisma/adapter-pg`)
- **Auth Provider**: Supabase Auth (integrated via `@supabase/ssr` and `@supabase/supabase-js`)
- **Email Provider**: Resend (`resend` package for app emails; Supabase Auth emails via custom SMTP through Resend)
- **File Storage**: Supabase Storage (used for resumes)
- **Data Fetching (Client)**: SWR

## Architecture overview
- **`src/app/(auth)`**: Contains the public authentication pages (Login, Signup).
- **`src/app/(app)`**: Contains the authenticated core application pages (Dashboard, Teams, Notifications).
- **`src/app/(onboarding)`**: Houses the profile completion flow directly after account creation.
- **`src/app/api/`**: Next.js API routes that serve as the backend, split into resource domains (`/users`, `/teams`, `/join-requests`, `/admin`, etc.).
- **`src/middleware.ts`**: Handles route protection by validating Supabase Auth JWTs on every request to ensure public vs. private route access control.
- **`prisma/schema.prisma`**: The single source of truth for the database schema, containing enums and models that define the core business entities.
- **Authentication Flow**: Users sign up/login via Supabase Auth. A record is subsequently synced to the Prisma `User` table linked by the `auth_user_id` field.
- **File Uploads**: Resumes are uploaded via API routes (e.g. `/api/users/resume`) directly to a private Supabase Storage bucket using a Service Role Key, bypassing public Row Level Security for safety. The database only stores the filename reference (`resume_storage_path`).

## Key business logic / domain rules
- **Gender Quotas**: Teams have specific constraints derived from the `Event` configuration (e.g., SIH requires at least 1 female). A derived field `needed_female_count` ensures these quotas are satisfied before a team is marked complete. Users have a `counts_toward_female_quota` boolean rather than a hardcoded gender enum. **No verification gate**: every registered user's self-reported gender counts directly toward the quota, consistently across all quota calculations (team creation, join-request accept, leave, event validation, admin export/unmatched views).
- **Bidirectional Join Requests**: Users can request to join teams (`user_to_team`), and teams can invite users (`team_to_user`).
- **Democratic Approvals**: Existing team members can cast "opinions" (approve/reject/neutral) on pending join requests before the leader makes a final decision.
- **Privacy & Visibility**: 
  - User contact visibility (phone, WhatsApp) is controlled via `preferred_contact_visibility` (public, team_only, private), but a team leader's contact info is often forced to be visible so applicants can reach out.
  - The phone number collected at signup serves as the informal identity signal in place of ID verification (closed, single-college user base).

## Known constraints and gotchas
- **File Uploads**: Files uploaded to Supabase Storage (Resumes) are stored in private buckets. They must be served through authenticated API routes that generate signed URLs; they cannot be accessed via direct public links.
- **Supabase Email Rate Limits**: Without a custom SMTP provider, Supabase's built-in email sending is rate-limited. Custom SMTP through Resend (with a verified sender domain) removes the sandbox restriction.
- **Route Handlers and Auth**: Next.js App Router API handlers use `createClient()` from `@/lib/supabase/server` to parse cookies for auth. Be mindful of Next.js caching rules when writing `GET` endpoints relying on headers/cookies.

## Current state / in-progress work
- **Auth Provider Pivot**: The project is stabilized on **Supabase Auth** after a reverted migration attempt to Clerk. No Clerk code, dependencies, or references remain.
- **Identity Verification Removed**: The entire OCR/ID-card/Path-B verification system (API routes, admin pages, schema fields/enums/models, tests, env entries) has been fully stripped. Signup goes straight from email/password authentication to the dashboard with no ID upload step and no verification gate in onboarding.
- **Email Delivery**: Supabase Auth emails are delivered via custom SMTP through Resend with the verified `arkaa.online` domain. The `resend` package handles app-level emails (team invites).
