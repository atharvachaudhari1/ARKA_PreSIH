-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- Seed from current user departments (normalized uppercase) + baseline codes.
INSERT INTO "departments" ("id", "name", "created_at")
SELECT 'cms_dept_seed_' || md5(UPPER(TRIM("department")))::text, UPPER(TRIM("department")), NOW()
FROM "users"
WHERE "department" IS NOT NULL AND TRIM("department") <> ''
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "departments" ("id", "name", "created_at")
SELECT 'cms_dept_base_' || md5(v), v, NOW()
FROM (VALUES ('CE'), ('CSE'), ('ECS'), ('MECH')) AS t(v)
ON CONFLICT ("name") DO NOTHING;
