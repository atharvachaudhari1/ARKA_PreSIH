-- Migration: strip_identity_verification
-- Fully removes the OCR / ID-card / verification (Path B) subsystem:
--   * drops the OcrVerificationAttempt and EmailVerificationOTP tables
--   * drops all verification/OCR columns from users
--   * drops the VerificationStatus and VerificationMethod enum types
-- No verification gate remains: every registered user's self-reported gender
-- counts toward the SIH female quota directly (counts_toward_female_quota).

-- 1. Drop tables holding FKs to users
DROP TABLE IF EXISTS "public"."email_verification_otps";
DROP TABLE IF EXISTS "public"."ocr_verification_attempts";

-- 2. Drop verification/OCR columns from users (index users_verification_status_idx drops automatically)
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "id_card_storage_path";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "verification_status";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "verification_method";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "verified_at";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "ocr_parsed_name";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "ocr_parsed_department";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "ocr_parsed_college";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "ocr_confidence_score";

-- 3. Drop the enum types
DROP TYPE IF EXISTS "public"."VerificationStatus";
DROP TYPE IF EXISTS "public"."VerificationMethod";
