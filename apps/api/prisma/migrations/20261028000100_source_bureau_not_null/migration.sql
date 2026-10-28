-- Every application write path sets the original source bureau. Enforce it so the
-- (sourceBureauId, originalId) uniqueness also covers rows that predate the operational backend.
UPDATE "Complaint" SET "sourceBureauId" = "bureauId" WHERE "sourceBureauId" IS NULL;

-- AlterTable
ALTER TABLE "Complaint" ALTER COLUMN "sourceBureauId" SET NOT NULL;
