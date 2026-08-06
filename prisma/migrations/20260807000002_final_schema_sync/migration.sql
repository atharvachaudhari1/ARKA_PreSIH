-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('auto', 'manual_review');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'team_dissolved';

-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'cancelled';

-- AlterEnum
ALTER TYPE "TeamStatus" ADD VALUE 'dissolved';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "github_url" TEXT,
ADD COLUMN     "ocr_confidence_score" DOUBLE PRECISION,
ADD COLUMN     "ocr_parsed_college" TEXT,
ADD COLUMN     "ocr_parsed_department" TEXT,
ADD COLUMN     "ocr_parsed_name" TEXT,
ADD COLUMN     "resume_storage_path" TEXT,
ADD COLUMN     "verification_method" "VerificationMethod",
ADD COLUMN     "verified_at" TIMESTAMP(3);
