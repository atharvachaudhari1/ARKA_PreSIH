-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "ContactVisibility" AS ENUM ('public_to_logged_in', 'team_only', 'private');

-- CreateEnum
CREATE TYPE "Proficiency" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('open', 'full');

-- CreateEnum
CREATE TYPE "SuccessionMode" AS ENUM ('manual', 'auto_promote');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('leader', 'member');

-- CreateEnum
CREATE TYPE "RequestDirection" AS ENUM ('user_to_team', 'team_to_user');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "ExpiredReason" AS ENUM ('timeout', 'requester_joined_another_team');

-- CreateEnum
CREATE TYPE "Opinion" AS ENUM ('approve', 'reject', 'neutral');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('new_join_request', 'teammate_opinion_added', 'leader_decision_made', 'request_accepted', 'request_rejected', 'request_expired_other_team_joined', 'team_now_full');

-- CreateEnum
CREATE TYPE "NotificationReadStatus" AS ENUM ('unread', 'read');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "college" TEXT,
    "id_card_storage_path" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "gender" "Gender",
    "phone_number" TEXT,
    "whatsapp_number" TEXT,
    "linkedin_url" TEXT,
    "contact_visibility" "ContactVisibility" NOT NULL DEFAULT 'private',
    "past_hackathons_count" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "presentation_skill_rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "proficiency" "Proficiency" NOT NULL DEFAULT 'intermediate',

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "team_size_max" INTEGER NOT NULL,
    "min_female_required" INTEGER NOT NULL DEFAULT 1,
    "registration_deadline" TIMESTAMP(3),
    "themes" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "leader_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "domain_interest" TEXT,
    "skills_needed" TEXT[],
    "needed_female_count" INTEGER NOT NULL DEFAULT 1,
    "status" "TeamStatus" NOT NULL DEFAULT 'open',
    "succession_mode" "SuccessionMode" NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_memberships" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "join_requests" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "direction" "RequestDirection" NOT NULL DEFAULT 'user_to_team',
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "expired_reason" "ExpiredReason",
    "final_decision_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "join_request_opinions" (
    "id" TEXT NOT NULL,
    "join_request_id" TEXT NOT NULL,
    "team_member_id" TEXT NOT NULL,
    "opinion" "Opinion" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "join_request_opinions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "read_status" "NotificationReadStatus" NOT NULL DEFAULT 'unread',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_user_id_skill_key" ON "user_skills"("user_id", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "team_memberships_team_id_user_id_key" ON "team_memberships"("team_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "join_request_opinions_join_request_id_team_member_id_key" ON "join_request_opinions"("join_request_id", "team_member_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_status_idx" ON "notifications"("user_id", "read_status");

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_final_decision_by_fkey" FOREIGN KEY ("final_decision_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_request_opinions" ADD CONSTRAINT "join_request_opinions_join_request_id_fkey" FOREIGN KEY ("join_request_id") REFERENCES "join_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_request_opinions" ADD CONSTRAINT "join_request_opinions_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
