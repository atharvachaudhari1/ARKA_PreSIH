-- Migration: add_team_name_unique
-- Enforces team-name uniqueness at the database level so no two teams can
-- share a name. Previously this was only checked (if at all) at the
-- application/frontend layer.

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");
