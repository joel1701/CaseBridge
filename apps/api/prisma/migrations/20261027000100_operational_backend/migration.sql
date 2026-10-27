-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AlertType" ADD VALUE 'ESCALATION';
ALTER TYPE "AlertType" ADD VALUE 'STATUS_CHANGE';

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "location" TEXT,
ADD COLUMN     "region" TEXT;

-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "sourceBureauId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "CoordinationWorkspace" (
    "id" TEXT NOT NULL,
    "caseLinkId" TEXT NOT NULL,
    "coordinatorId" TEXT,
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'OPEN',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoordinationWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoordinationSharedAction" (
    "workspaceId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "linkedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoordinationSharedAction_pkey" PRIMARY KEY ("workspaceId","actionId")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginThrottle" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginThrottle_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoordinationWorkspace_caseLinkId_key" ON "CoordinationWorkspace"("caseLinkId");

-- CreateIndex
CREATE INDEX "CoordinationWorkspace_coordinatorId_status_idx" ON "CoordinationWorkspace"("coordinatorId", "status");

-- CreateIndex
CREATE INDEX "CoordinationSharedAction_actionId_idx" ON "CoordinationSharedAction"("actionId");

-- CreateIndex
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "AuthSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Complaint_assignedToId_status_idx" ON "Complaint"("assignedToId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_sourceBureauId_originalId_key" ON "Complaint"("sourceBureauId", "originalId");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_dedupeKey_key" ON "Alert"("dedupeKey");

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_sourceBureauId_fkey" FOREIGN KEY ("sourceBureauId") REFERENCES "Bureau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinationWorkspace" ADD CONSTRAINT "CoordinationWorkspace_caseLinkId_fkey" FOREIGN KEY ("caseLinkId") REFERENCES "CaseLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinationWorkspace" ADD CONSTRAINT "CoordinationWorkspace_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinationWorkspace" ADD CONSTRAINT "CoordinationWorkspace_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinationSharedAction" ADD CONSTRAINT "CoordinationSharedAction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "CoordinationWorkspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinationSharedAction" ADD CONSTRAINT "CoordinationSharedAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "InvestigationAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinationSharedAction" ADD CONSTRAINT "CoordinationSharedAction_linkedById_fkey" FOREIGN KEY ("linkedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve the original source bureau before any operational transfers occur.
UPDATE "Complaint" SET "sourceBureauId" = "bureauId" WHERE "sourceBureauId" IS NULL;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_version_nonnegative" CHECK ("version" >= 0);
ALTER TABLE "CoordinationWorkspace" ADD CONSTRAINT "Workspace_version_nonnegative" CHECK ("version" >= 0);

CREATE INDEX "Alert_bureauId_resolvedAt_createdAt_idx" ON "Alert"("bureauId", "resolvedAt", "createdAt");
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
