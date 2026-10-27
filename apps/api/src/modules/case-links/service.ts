import type { PrismaClient } from '../../generated/prisma/client.js';
import type { Principal } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';
import {
  authorizedComplaint,
  authorizedLink,
  canRead,
  linkScope,
  requireReviewer,
  parseInput,
} from './access.js';
import { withInstitutionLock } from './transaction.js';
import { permittedExplanation } from './serialization.js';
import { reviewSchema, type ReviewInput } from './validation.js';
export class CaseLinkService {
  constructor(private db: PrismaClient) {}
  async list(
    principal: Principal,
    caseId: string,
    page: number,
    pageSize: number,
  ) {
    return this.db.$transaction(
      async (tx) => {
        await authorizedComplaint(tx, principal, caseId);
        const where = {
          AND: [
            linkScope(principal),
            {
              OR: [
                { sourceComplaintId: caseId },
                { targetComplaintId: caseId },
              ],
            },
          ],
        };
        const [links, total] = await Promise.all([
          tx.caseLink.findMany({
            where,
            include: {
              sourceComplaint: { include: { bureau: true } },
              targetComplaint: { include: { bureau: true } },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
          tx.caseLink.count({ where }),
        ]);
        const items = links.map((link) => {
          const other =
            link.sourceComplaintId === caseId
              ? link.targetComplaint
              : link.sourceComplaint;
          const restricted = !canRead(principal, other);
          return {
            id: link.id,
            status: link.status,
            score: link.score,
            otherComplaint: {
              id: restricted ? null : other.id,
              bureauCode: other.bureau.code,
              restricted,
            },
            explanation: permittedExplanation(link.explanation, restricted),
            modelVersion: link.modelVersion,
            updatedAt: link.updatedAt,
            reviewedAt: link.reviewedAt,
            ...(!restricted
              ? {
                  reviewedById: link.reviewedById,
                  reviewReason: link.reviewReason,
                }
              : {}),
          };
        });
        return { data: { items }, meta: { page, pageSize, total } };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }
  async review(principal: Principal, id: string, input: ReviewInput) {
    requireReviewer(principal);
    input = parseInput(reviewSchema, input);
    const initial = await authorizedLink(this.db, principal, id);
    return withInstitutionLock(
      this.db,
      initial.sourceComplaint.institutionId,
      async (tx) => {
        const link = await authorizedLink(tx, principal, id);
        if (
          link.sourceComplaint.institutionId !==
            initial.sourceComplaint.institutionId ||
          link.targetComplaint.institutionId !==
            link.sourceComplaint.institutionId
        )
          throw new AppError(
            409,
            'CASE_CHANGED',
            'Linked complaint institution changed; reload the relationship',
          );
        const expected = new Date(input.expectedUpdatedAt);
        const reviewedAt = new Date(
          Math.max(Date.now(), link.updatedAt.getTime() + 1),
        );
        const update = await tx.caseLink.updateMany({
          where: { id, updatedAt: expected },
          data: {
            status: input.status,
            reviewReason: input.reason,
            reviewedById: principal.id,
            reviewedAt,
            updatedAt: reviewedAt,
          },
        });
        if (update.count !== 1)
          throw new AppError(
            409,
            'STALE_REVIEW',
            'Relationship changed; reload before reviewing',
          );
        for (const complaintId of [
          link.sourceComplaintId,
          link.targetComplaintId,
        ]) {
          const pending = await tx.caseLink.count({
            where: {
              status: 'SUGGESTED',
              OR: [
                { sourceComplaintId: complaintId },
                { targetComplaintId: complaintId },
              ],
            },
          });
          await tx.complaint.update({
            where: { id: complaintId },
            data: { overlapReviewStatus: pending ? 'PENDING' : 'REVIEWED' },
          });
        }
        const complaintId = canRead(principal, link.sourceComplaint)
          ? link.sourceComplaintId
          : link.targetComplaintId;
        await tx.auditLog.create({
          data: {
            actorId: principal.id,
            complaintId,
            event: 'CASE_LINK_REVIEWED',
            metadata: {
              caseLinkId: id,
              previousStatus: link.status,
              status: input.status,
              reason: input.reason,
            },
          },
        });
        return {
          id,
          status: input.status,
          reviewedById: principal.id,
          reviewReason: input.reason,
          reviewedAt,
          updatedAt: reviewedAt,
        };
      },
    );
  }
}
