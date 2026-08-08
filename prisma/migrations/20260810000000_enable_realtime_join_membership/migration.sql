-- Enable Realtime + RLS for join_requests and team_memberships so client pages
-- (Join Requests page, Team detail page) update live when a request is resolved
-- or a new member joins.
--
-- Reads happen server-side via Prisma (which bypasses RLS); these policies only
-- gate Realtime row delivery to the correct users.

-- join_requests: users see requests they sent, or requests for a team they are in.
ALTER TABLE "join_requests" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read requests they sent or for their team"
  ON "join_requests"
  FOR SELECT
  USING (
    requester_id IN (SELECT id FROM "users" WHERE auth_user_id = (auth.uid())::text)
    OR is_team_member(team_id)
  );

-- team_memberships: users see memberships of teams they are in.
ALTER TABLE "team_memberships" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read memberships of teams they are in"
  ON "team_memberships"
  FOR SELECT
  USING (is_team_member(team_id));

-- Publish both tables to Realtime.
ALTER PUBLICATION supabase_realtime ADD TABLE "join_requests";
ALTER PUBLICATION supabase_realtime ADD TABLE "team_memberships";
