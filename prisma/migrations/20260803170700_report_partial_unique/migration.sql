-- Drop the flat unique indexes
DROP INDEX IF EXISTS "reports_reporter_id_reported_user_id_key";
DROP INDEX IF EXISTS "reports_reporter_id_reported_team_id_key";

-- Create partial unique indexes that only apply to open reports
CREATE UNIQUE INDEX "reports_active_user_idx" ON "reports"("reporter_id", "reported_user_id") WHERE status = 'open';
CREATE UNIQUE INDEX "reports_active_team_idx" ON "reports"("reporter_id", "reported_team_id") WHERE status = 'open';
