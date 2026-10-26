-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'BUREAU_HEAD', 'OFFICER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('RECEIVED', 'UNDER_PROCESS', 'TRANSFERRED', 'ESCALATED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "OverlapReviewStatus" AS ENUM ('NOT_REVIEWED', 'PENDING', 'REVIEWED');

-- CreateEnum
CREATE TYPE "CaseLinkStatus" AS ENUM ('SUGGESTED', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('EVIDENCE_REQUEST', 'INSPECTION', 'NOTICE', 'REVIEW');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CoordinationType" AS ENUM ('SHARE_EVIDENCE', 'JOINT_INVESTIGATION', 'DEFER_ACTION', 'KEEP_SEPARATE');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('OVERLAP', 'ACTION_CONFLICT', 'DEADLINE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OFFICER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "bureauId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bureau" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bureau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "permanentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "bureauId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'RECEIVED',
    "overlapReviewStatus" "OverlapReviewStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseLink" (
    "id" TEXT NOT NULL,
    "sourceComplaintId" TEXT NOT NULL,
    "targetComplaintId" TEXT NOT NULL,
    "status" "CaseLinkStatus" NOT NULL DEFAULT 'SUGGESTED',
    "score" DOUBLE PRECISION,
    "explanation" JSONB NOT NULL,
    "modelVersion" TEXT,
    "reviewedById" TEXT,
    "reviewReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationAction" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "bureauId" TEXT NOT NULL,
    "createdById" TEXT,
    "type" "ActionType" NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'PLANNED',
    "summary" TEXT NOT NULL,
    "evidenceScope" TEXT,
    "dueAt" TIMESTAMP(3),
    "overrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestigationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoordinationDecision" (
    "id" TEXT NOT NULL,
    "caseLinkId" TEXT NOT NULL,
    "decidedById" TEXT NOT NULL,
    "type" "CoordinationType" NOT NULL,
    "rationale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoordinationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "bureauId" TEXT NOT NULL,
    "complaintId" TEXT,
    "type" "AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "complaintId" TEXT,
    "event" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_bureauId_role_idx" ON "User"("bureauId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Bureau_code_key" ON "Bureau"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_permanentId_key" ON "Institution"("permanentId");

-- CreateIndex
CREATE INDEX "Institution_name_idx" ON "Institution"("name");

-- CreateIndex
CREATE INDEX "Complaint_institutionId_category_idx" ON "Complaint"("institutionId", "category");

-- CreateIndex
CREATE INDEX "Complaint_bureauId_status_createdAt_idx" ON "Complaint"("bureauId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Complaint_overlapReviewStatus_idx" ON "Complaint"("overlapReviewStatus");

-- CreateIndex
CREATE INDEX "Complaint_dueAt_idx" ON "Complaint"("dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_bureauId_originalId_key" ON "Complaint"("bureauId", "originalId");

-- CreateIndex
CREATE INDEX "CaseLink_targetComplaintId_status_idx" ON "CaseLink"("targetComplaintId", "status");

-- CreateIndex
CREATE INDEX "CaseLink_status_idx" ON "CaseLink"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CaseLink_sourceComplaintId_targetComplaintId_key" ON "CaseLink"("sourceComplaintId", "targetComplaintId");

-- CreateIndex
CREATE INDEX "InvestigationAction_complaintId_status_idx" ON "InvestigationAction"("complaintId", "status");

-- CreateIndex
CREATE INDEX "InvestigationAction_bureauId_type_status_idx" ON "InvestigationAction"("bureauId", "type", "status");

-- CreateIndex
CREATE INDEX "InvestigationAction_dueAt_idx" ON "InvestigationAction"("dueAt");

-- CreateIndex
CREATE INDEX "CoordinationDecision_caseLinkId_createdAt_idx" ON "CoordinationDecision"("caseLinkId", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_bureauId_readAt_createdAt_idx" ON "Alert"("bureauId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_complaintId_createdAt_idx" ON "AuditLog"("complaintId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_bureauId_fkey" FOREIGN KEY ("bureauId") REFERENCES "Bureau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_bureauId_fkey" FOREIGN KEY ("bureauId") REFERENCES "Bureau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseLink" ADD CONSTRAINT "CaseLink_sourceComplaintId_fkey" FOREIGN KEY ("sourceComplaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseLink" ADD CONSTRAINT "CaseLink_targetComplaintId_fkey" FOREIGN KEY ("targetComplaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseLink" ADD CONSTRAINT "CaseLink_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationAction" ADD CONSTRAINT "InvestigationAction_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationAction" ADD CONSTRAINT "InvestigationAction_bureauId_fkey" FOREIGN KEY ("bureauId") REFERENCES "Bureau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationAction" ADD CONSTRAINT "InvestigationAction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinationDecision" ADD CONSTRAINT "CoordinationDecision_caseLinkId_fkey" FOREIGN KEY ("caseLinkId") REFERENCES "CaseLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinationDecision" ADD CONSTRAINT "CoordinationDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_bureauId_fkey" FOREIGN KEY ("bureauId") REFERENCES "Bureau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Canonical ordered pairs prevent self-links and reversed duplicates.
ALTER TABLE "CaseLink" ADD CONSTRAINT "CaseLink_ordered_pair" CHECK ("sourceComplaintId" < "targetComplaintId");
ALTER TABLE "CaseLink" ADD CONSTRAINT "CaseLink_score_range" CHECK ("score" IS NULL OR ("score" >= -1 AND "score" <= 1));
