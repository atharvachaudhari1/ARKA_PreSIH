-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('spam', 'harassment', 'inappropriate_content', 'other');
CREATE TYPE "ReportStatus" AS ENUM ('open', 'resolved', 'dismissed');

-- AlterTable
-- Backfill preferred_contact_visibility: 
-- We rename the column instead of dropping and adding.
ALTER TABLE "users" RENAME COLUMN "contact_visibility" TO "preferred_contact_visibility";

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reported_user_id" TEXT,
    "reported_team_id" TEXT,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_reporter_id_reported_user_id_key" ON "reports"("reporter_id", "reported_user_id");
CREATE UNIQUE INDEX "reports_reporter_id_reported_team_id_key" ON "reports"("reporter_id", "reported_team_id");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_team_id_fkey" FOREIGN KEY ("reported_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Phase 4 Closure: Revoke EXECUTE on realtime verification functions from PUBLIC
REVOKE EXECUTE ON FUNCTION is_team_member(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_user_notification(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_team_member(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_user_notification(TEXT) TO authenticated, service_role;
