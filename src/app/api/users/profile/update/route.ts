/**
 * This route re-exports the PATCH handler from the parent profile route
 * for backward compatibility with any clients using /api/users/profile/update.
 * 
 * The canonical implementation lives in profile/route.ts.
 */
export { PATCH } from "@/app/api/users/profile/route";
