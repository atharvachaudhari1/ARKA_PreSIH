
-- CreateTable
CREATE TABLE "ocr_verification_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ocr_parsed_name" TEXT,
    "ocr_parsed_department" TEXT,
    "ocr_parsed_college" TEXT,
    "ocr_confidence_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_verification_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_slots" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "role_title" TEXT,
    "gender" TEXT NOT NULL DEFAULT 'any',
    "skills" TEXT[],
    "is_filled" BOOLEAN NOT NULL DEFAULT false,
    "filled_by_user_id" TEXT,

    CONSTRAINT "team_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_otps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_verification_status_idx" ON "users"("verification_status");

-- CreateIndex
CREATE INDEX "teams_status_idx" ON "teams"("status");

-- CreateIndex
CREATE INDEX "teams_event_id_idx" ON "teams"("event_id");

-- CreateIndex
CREATE INDEX "team_memberships_team_id_role_idx" ON "team_memberships"("team_id", "role");

-- CreateIndex
CREATE INDEX "join_requests_team_id_requester_id_idx" ON "join_requests"("team_id", "requester_id");

-- CreateIndex
CREATE INDEX "join_requests_status_idx" ON "join_requests"("status");

-- CreateIndex
CREATE INDEX "email_verification_otps_user_id_email_idx" ON "email_verification_otps"("user_id", "email");

-- AddForeignKey
ALTER TABLE "ocr_verification_attempts" ADD CONSTRAINT "ocr_verification_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_slots" ADD CONSTRAINT "team_slots_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_slots" ADD CONSTRAINT "team_slots_filled_by_user_id_fkey" FOREIGN KEY ("filled_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_otps" ADD CONSTRAINT "email_verification_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
