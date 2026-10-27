import type { PrismaClient } from '../../generated/prisma/client.js';
import type { Principal } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';
import {
  authorizedLink,
  canRead,
  requireReviewer,
  parseInput,
} from '../case-links/access.js';
import { withInstitutionLock } from '../case-links/transaction.js';
import { coordinationSchema, type CoordinationInput } from './validation.js';
export class CoordinationService {
  constructor(private db: PrismaClient) {}
  async record(principal: Principal, input: CoordinationInput) {
    requireReviewer(principal);
    input = parseInput(coordinationSchema, input);
    const initial = await authorizedLink(this.db, principal, input.caseLinkId);
    return withInstitutionLock(
      this.db,
      initial.sourceComplaint.institutionId,
      async (tx) => {
        const link = await authorizedLink(tx, principal, input.caseLinkId);
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
        if (input.type !== 'KEEP_SEPARATE' && link.status !== 'CONFIRMED')
          throw new AppError(
            409,
            'INVALID_STATE',
            'Confirm the relationship before recording joint coordination',
          );
        const decision = await tx.coordinationDecision.create({
          data: { ...input, decidedById: principal.id },
          select: {
            id: true,
            caseLinkId: true,
            type: true,
            rationale: true,
            decidedById: true,
            createdAt: true,
          },
        });
        const complaintId = canRead(principal, link.sourceComplaint)
          ? link.sourceComplaintId
          : link.targetComplaintId;
        await tx.auditLog.create({
          data: {
            actorId: principal.id,
            complaintId,
            event: 'COORDINATION_RECORDED',
            metadata: {
              decisionId: decision.id,
              caseLinkId: link.id,
              type: input.type,
              involvedBureauIds: [
                ...new Set([
                  link.sourceComplaint.bureauId,
                  link.targetComplaint.bureauId,
                ]),
              ],
              rationale: input.rationale,
            },
          },
        });
        // Recording agreement does not mutate action status or grant evidence access.
        return decision;
      },
    );
  }
}
