# Instructions for OpenCode Agent

Hello OpenCode! Welcome to the TeamUp project. Your objective is to thoroughly audit the current state of the application, identify any underlying issues in both the Frontend (UI/UX) and Backend (API/Database), and resolve them.

## Step 1: Understand the Project
1. **Read `PROJECT_CONTEXT.md`**: Start by reading the `PROJECT_CONTEXT.md` file located in the root of this repository. It contains the complete architecture, tech stack, and key domain rules (e.g., female quotas, join requests, verification flows).
2. **Review the Schema**: Examine `prisma/schema.prisma` to understand the database relationships and constraints.
3. **Check the Current State**: Be aware that the project previously underwent a reverted migration from Supabase Auth to Clerk Auth. It is stable on **Supabase Auth**. Identity verification (OCR/ID-card) has been fully removed; auth emails go through Resend custom SMTP.

## Step 2: Discover Issues
Perform a comprehensive audit of the application to find bugs, edge cases, and UI inconsistencies. Please focus on:

### Backend / API
- **Auth Integrity**: Check `src/middleware.ts` and API routes (`src/app/api/...`) to ensure Supabase Auth (`@supabase/ssr`) is securely protecting routes and correctly extracting the `auth_user_id`.
- **Error Handling**: Verify that API endpoints gracefully handle missing payloads, unauthorized access, and database failures without crashing the server.
- **Race Conditions**: Look for potential race conditions in join requests (e.g., a user getting accepted into two teams simultaneously) or team size limits (`team_size_max`).
- **File Storage Security**: Ensure that the API routes interacting with Supabase Storage (like `/api/users/resume`) are properly restricting access to private buckets.

### Frontend / UI
- **Responsive Design**: Ensure Tailwind CSS classes in `src/app/(app)` and `src/app/(auth)` provide a seamless experience on both mobile and desktop.
- **State Management**: Review SWR data fetching and React state for stale data or infinite re-renders.
- **UX Polish**: Check for missing loading states, unhandled error toasts (we use a custom `ToastProvider`), or misaligned SVG icons (we recently transitioned to `lucide-react`).
- **Redirect Loops**: Verify that the onboarding flow (`/profile/complete`) handles uncompleted profiles correctly without causing infinite redirects for users navigating the dashboard.

## Step 3: Resolve Discovered Issues
Once you have mapped out the issues:
1. **Report**: Briefly list the critical issues you have discovered.
2. **Fix**: Implement the fixes directly in the codebase. Prioritize backend security and critical functional bugs before polishing UI nuances.
3. **Test**: If applicable, run or update the Playwright tests in the `tests/` directory to ensure your fixes didn't break existing E2E flows.

Good luck! Your primary directive is to make this app bulletproof for production deployment.
