# CHANGELOG

All notable changes to TeamUp are documented here.
Each entry follows the End-of-Session Brief format from the Build Guide (Section 10).

---

### Session Brief — 2026-08-03 | Phase 4 — Notifications & Chat

**Phase:** Phase 4 — Notifications & Chat

**What was built/changed:**
- **In-App Notifications**: Created a `NotificationCenter` UI component, integrated into `AppNavbar`. Displays unread notification counts and historical notifications.
- **Chat System**: Added the `ChatMessage` model to Prisma schema.
- **Chat UI**: Built `/teams/[id]/chat` for team members to communicate securely.
- **API Endpoints**: 
  - `GET /api/notifications`
  - `PATCH /api/notifications/[id]/read`
  - `GET /api/teams/[id]/chat`
  - `POST /api/teams/[id]/chat`
- **Notification Triggers**: Retrofitted `POST /api/join-requests` and `PATCH /api/join-requests/[id]/opinion` to instantly trigger `new_join_request` and `teammate_opinion_added` notifications.
- **Real-time & Security**: Implemented a raw SQL migration to enable PostgreSQL Row-Level Security (RLS) on both `notifications` and `chat_messages` tables. Connected Supabase Realtime using private channels (`room_team_[id]` and `user_[id]`).

**Decisions made:**
- Opted for raw SQL RLS rules in Prisma migrations rather than relying on broadcast channels without auth-checks. This strictly prevents users from subscribing to other users' notifications or other teams' chat messages at the PostgreSQL layer.

**Tests added/updated:**
- Added `src/__tests__/api/chat.test.ts` to verify strict 403 Forbidden checks on non-members attempting to read/write messages.
- Added `src/__tests__/api/notifications.test.ts` to ensure users can only access their own notifications.
- All tests pass, ensuring complete authorization isolation.

**Known gaps / TODO next session (Phase 5):**
- Leader succession and the `auto_promote` algorithm.
- Ensure leader contact info visibility reverts upon succession.
- Report/block system for platform safety.

**Docs updated:** Yes — task.md, implementation_plan.md, walkthrough.md, CHANGELOG.md (this entry).

---

### Session Brief — 2026-08-03 | Phase 3 — Join Request Flow

**Phase:** Phase 3 — Join Request Flow

**What was built/changed:**
- **Join Requests API**: Implemented `POST /api/join-requests` and `GET /api/join-requests` to create and retrieve pending applications.
- **Consultative Voting**: Implemented `PATCH /api/join-requests/:id/opinion` enabling team members to vote (`approve`, `reject`, `neutral`).
- **Leader Decision**: Implemented `PATCH /api/join-requests/:id/decision` allowing the leader to accept or reject an applicant.
- **Cascade-Expiry**: On applicant acceptance, all of their other pending requests are expired atomically (`requester_joined_another_team`).
- **Team Full Auto-transition**: On applicant acceptance, if the team hits maximum capacity (e.g. 6), its status becomes `full` and all other pending applications to the team are cascade-expired (`team_full`).
- **Unified Requests Dashboard**: Built `src/app/(app)/requests/page.tsx` with "My Requests" and "Team Requests" tabs.
- **Team Details Profile**: Built `src/app/(app)/teams/[id]/page.tsx` with an active "Send Join Request" CTA.

**Decisions made:**
- Opted for a unified `/requests` page instead of splitting team requests into the team dashboard for Phase 3.
- Removed `/api/join-requests/:id/transfer-leadership` from Phase 3 scope as succession is technically Phase 5.
- Enforced identity reveal rule: Contact info remains hidden on the team's pending request view; it is only visible once the `TeamMembership` is fully established post-accept.
- Added `team_full` enum value to `ExpiredReason` in Prisma schema and executed a migration.

**Tests added/updated:**
- Added `src/__tests__/api/join-requests.test.ts` to verify duplicate request prevention, member opinion voting, and the atomic accept/cascade-expire transaction. All tests pass.

**Known gaps / TODO next session (Phase 4):**
- Real-time Notifications: Wire up the in-app notification center using Supabase Realtime for the newly generated Notification records.
- Basic in-app chat (post-match).

**Docs updated:** Yes — task.md, docs/api.md, CHANGELOG.md (this entry).

---

### Session Brief — 2026-08-03 | Phase 2 — Team Creation & Browse Dashboard

**Phase:** Phase 2 — Team Creation & Browse Dashboard

**What was built/changed:**
- `Team` schema extended with `min_experience_required`.
- Auto-seeding of default "SIH 2026" Event for `Team` creation.
- `POST /api/teams` to create a team, setting creator as leader and forcing contact visibility to `public_to_logged_in`.
- `GET /api/teams` and `GET /api/teams/[id]` with filtering logic (vacancy, skill, gender, domain, min experience) and strict semi-transparency rules (member contact info is hidden).
- Team creation page (`src/app/(app)/teams/create/page.tsx`) with dynamic domains and skills needed UI.
- `TeamCard` component for displaying rich team data.
- Dashboard (`src/app/(app)/dashboard/page.tsx`) completely rebuilt with dynamic team browsing and interactive filtering chips.
- API testing suite for teams in `src/__tests__/api/teams.test.ts`.

**Decisions made:**
- Used a predefined dropdown of SIH themes for domains.
- Min experience filter strictly implemented using `>=` against teams' requirements.
- Leader contact visibility enforced at the DB level when a team is created.

**Tests added/updated:**
- Added `teams.test.ts` to test GET and POST endpoints for `/api/teams`. All tests pass.

**Known gaps / TODO next session (Phase 3):**
- Join Requests Flow (`/api/join-requests`).
- Transfer Leadership action.
- Consultative opinion voting.
- Leader accept/reject decision logic with Cascade-expiry (both directions).
- "Full" status transitions when teams hit size limits.

**Docs updated:** Yes — task.md, docs/api.md, CHANGELOG.md (this entry).

---

## 2026-08-03

### Session Brief — 2026-08-03 | Phase 1 — Auth + Profile Complete

**Phase:** Phase 1 — Auth + Profile

**What was built/changed:**
- Created `src/app/(app)/layout.tsx` — Shared layout for all protected routes, verifies auth and profile existence. Redirects users to `/profile/complete` if no profile exists (e.g., first-time Google OAuth).
- Created `src/components/AppNavbar.tsx` — Desktop navigation with active route highlighting, "Create Team" CTA, and user dropdown menu.
- Created `src/app/profile/complete/page.tsx` — Onboarding page for users who skipped the initial signup form. Collects required profile info, presentation skill rating, and ID card upload.
- Created `src/app/(app)/profile/page.tsx` — Full profile view and edit page. Implements presentation skill rating UI (1-5), unverified badge logic for department (GAP-7), and skills management.
- Added `PATCH` method to `src/app/api/users/profile/route.ts` — Secure profile update endpoint. Enforces a field whitelist, validates gender/visibility enums, and explicitly excludes `id_card_storage_path` per GAP-6.
- Created `src/app/api/users/profile/update/route.ts` (helper file) - now merged into the main route.
- Created `src/app/api/users/skills/route.ts` — `POST`/`DELETE` endpoints for managing user skills with defined proficiencies (`beginner`, `intermediate`, `advanced`, `expert`).
- Updated `src/app/(app)/dashboard/page.tsx` — Removed duplicate navbar, integrated layout, and added quick action cards. Also displays the user's primary team if they belong to one.
- Added stub pages for upcoming Phase 2, 3, and 4 routes (`/teams`, `/teams/create`, `/requests`, `/notifications`) to prevent 404s in the navbar.
- Resolved all Next.js 14 / React 19 strict-mode ESLint warnings regarding state updates inside effects (`react-hooks/set-state-in-effect`).

**Decisions made:**
- Next.js layouts (`layout.tsx`) were effectively utilized to intercept users lacking a completed profile, providing a robust fallback for OAuth-driven signups.
- Merged the profile `PATCH` handler into the existing `GET/POST` route file for co-location of profile logic.
- Adopted `eslint-disable-next-line` where setting state in a `useEffect` was strictly necessary to map URL search params to initial local state.

**Tests added/updated:**
- Next.js linter rules fully pass. No automated test suites implemented yet (scheduled for later phases as the UI stabilizes).

**Known gaps / TODO next session (Phase 2):**
- Stub for OCR/AI verification pipeline is still pending (can be simulated as a background cron or admin webhook in the future).
- Moving on to Phase 2: Team Creation (`/teams/create`), browsing teams (`/teams`), and Team Cards implementation.

**Docs updated:** Yes — task.md (marked Phase 1 as complete) and CHANGELOG.md (this entry).

---

### Session Brief — 2026-08-03 | Phase 0 — Project Scaffold

**Phase:** Phase 0 — Project Scaffold

**What was built/changed:**
- Pre-Phase-0 Gap Resolution Pass completed: all 9 gaps identified, 5 user decisions collected, BUILD_GUIDE.md updated in-place with `[GAP-RESOLVED]` markers.
- Next.js 14 (App Router) project scaffolded with Tailwind CSS and ESLint.
- Installed: `@prisma/client`, `prisma`, `@supabase/supabase-js`, `@supabase/ssr`, `next-test-api-route-handler`, `jest`, `@testing-library/react`, `@testing-library/jest-dom`, `ts-jest`, `@types/jest`.
- `prisma/schema.prisma` — full data model: User, UserSkill, Event, Team, TeamMembership, JoinRequest, JoinRequestOpinion, Notification with all enums.
- `prisma/sql/add_pending_request_unique_index.sql` — partial unique index for GAP-RESOLVED-5.
- `src/lib/supabase/client.ts` — browser Supabase client.
- `src/lib/supabase/server.ts` — server Supabase client.
- `src/lib/prisma.ts` — singleton PrismaClient.
- `src/middleware.ts` — NFR6 auth guard: all routes protected, public-only routes for /login, /signup, /auth/*.
- `src/app/globals.css` — full design system: CSS custom properties, skill chips (monospace), status badges, cards, buttons, form inputs, glass effects, animations.
- `src/app/layout.tsx` — root layout with SEO metadata.
- `src/app/page.tsx` — landing page: hero, dual CTA (Join/Create), stats bar, how-it-works, transparency model explainer, footer.
- `src/app/(auth)/login/page.tsx` — login page: Google OAuth + email/password.
- `src/app/(auth)/signup/page.tsx` — signup: Devfolio-style dual path selection, Google OAuth, email+password + ID card upload.
- `src/app/(app)/dashboard/page.tsx` — protected dashboard with quick-action cards.
- `src/app/auth/callback/route.ts` — OAuth code exchange.
- `src/app/auth/error/page.tsx` — auth error page.
- `src/app/api/auth/signout/route.ts` — sign-out handler.
- `src/app/api/users/profile/route.ts` — GET/POST user profile (id_card never returned).
- `jest.config.ts` + `jest.setup.ts` — two-project Jest config (frontend/api).
- `.env.example`, `.env.local` (empty).
- `README.md`, `docs/architecture.md`, `docs/api.md`.

**Decisions made:**
- Visual theme: "Hacker-Professional Blend" — dark slate base, indigo brand, amber urgency accents, Inter + JetBrains Mono typography.
- Supabase SSR package (`@supabase/ssr`) used for cookie-based session management.
- No profile snapshot field on JoinRequest (GAP-RESOLVED-3): team always reads live User.
- Gender strictly binary `male`/`female` in schema (GAP-RESOLVED-2).
- ID card path stored in private Supabase bucket; path never returned via any API (GAP-RESOLVED-6).

**Tests added/updated:**
- Jest config scaffolded with two projects (frontend + api). No tests yet — first tests will be written in Phase 1.

**Known gaps / TODO next session (Phase 1):**
- User needs to create a Supabase project and fill `.env.local`.
- User needs to enable Google OAuth in Supabase dashboard.
- `npx prisma migrate dev --name init` must be run after env is configured.
- Phase 1: Profile CRUD page (`/profile`), skills management, presentation rating, update profile API.
- Phase 1: ID verification status display ("Unverified" badge) in public profile views (GAP-RESOLVED-7).
- Phase 1: Stub for OCR/AI verification pipeline (webhook or background function).
- Phase 2: Team creation (`/teams/create`), browse (`/teams`), team card component.

**Docs updated:** Yes — README.md, docs/architecture.md, docs/api.md, CHANGELOG.md (this entry).
