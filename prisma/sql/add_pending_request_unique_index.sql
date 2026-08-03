-- [GAP-RESOLVED-5] Partial unique index on JoinRequest
-- Prevents more than one PENDING request for the same (team_id, requester_id) pair.
-- Prisma's @@unique doesn't support WHERE clauses, so this is a raw SQL migration.
--
-- Run this after `npx prisma migrate dev --name init` to add the index:
--   npx prisma db execute --file prisma/sql/add_pending_request_unique_index.sql

CREATE UNIQUE INDEX IF NOT EXISTS join_requests_pending_unique
ON join_requests (team_id, requester_id)
WHERE (status = 'pending');

COMMENT ON INDEX join_requests_pending_unique IS
'[GAP-RESOLVED-5] Prevents duplicate pending join requests for the same (team, requester) pair. Application-level validation is also present, but this is the authoritative DB-level guard.';
