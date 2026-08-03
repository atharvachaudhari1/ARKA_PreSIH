# CHANGELOG

All notable changes to TeamUp are documented here.
Each entry follows the End-of-Session Brief format from the Build Guide (Section 10).

---

## 2026-08-03

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
