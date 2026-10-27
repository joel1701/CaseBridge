import type { PrismaClient, Prisma } from '../../generated/prisma/client.js';
import type { Principal } from '../../middleware/auth.js';
import { authorizedComplaint } from '../case-links/access.js';
import { withInstitutionLock } from '../case-links/transaction.js';
import { AppError } from '../../lib/errors.js';
import type { MatchComplaint, MatchExplanation } from './types.js';
export interface Suggestion {
  target: MatchComplaint;
  score: number;
  explanation: MatchExplanation;
}
export interface MatchingRepository {
  source(principal: Principal, id: string): Promise<MatchComplaint>;
  candidates(source: MatchComplaint, limit: number): Promise<MatchComplaint[]>;
  save(
    principal: Principal,
    source: MatchComplaint,
    suggestions: Suggestion[],
    modelVersion: string,
  ): Promise<
    Array<{
      id: string;
      status: string;
      score: number | null;
      explanation: unknown;
      modelVersion: string | null;
      updatedAt: Date;
    }>
  >;
}
export class PrismaMatchingRepository implements MatchingRepository {
  constructor(private db: PrismaClient) {}
  source(principal: Principal, id: string) {
    return authorizedComplaint(this.db, principal, id);
  }
  candidates(source: MatchComplaint, limit: number) {
    return this.db.complaint.findMany({
      where: { institutionId: source.institutionId, id: { not: source.id } },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit,
    });
  }
  save(
    principal: Principal,
    source: MatchComplaint,
    suggestions: Suggestion[],
    modelVersion: string,
  ) {
    return withInstitutionLock(this.db, source.institutionId, async (tx) => {
      // Brief row locks protect snapshot fields while suggestions are committed.
      const ids = [source.id, ...suggestions.map((s) => s.target.id)].sort();
      for (const id of ids)
        await tx.$queryRaw`SELECT id FROM "Complaint" WHERE id = ${id} FOR SHARE`;
      const current = await authorizedComplaint(tx, principal, source.id);
      if (
        current.updatedAt.getTime() !== source.updatedAt.getTime() ||
        current.institutionId !== source.institutionId
      )
        throw new AppError(
          409,
          'CASE_CHANGED',
          'Complaint changed during analysis; retry',
        );
      const saved = [];
      for (const suggestion of suggestions) {
        const target = await tx.complaint.findUnique({
          where: { id: suggestion.target.id },
        });
        if (
          !target ||
          target.institutionId !== source.institutionId ||
          target.updatedAt.getTime() !== suggestion.target.updatedAt.getTime()
        )
          throw new AppError(
            409,
            'CASE_CHANGED',
            'Candidate changed during analysis; retry',
          );
        const [sourceComplaintId, targetComplaintId] = [
          source.id,
          target.id,
        ].sort();
        const where = {
          sourceComplaintId_targetComplaintId: {
            sourceComplaintId,
            targetComplaintId,
          },
        };
        const existing = await tx.caseLink.findUnique({ where });
        if (existing && existing.status !== 'SUGGESTED') continue; // Never resurrect a rejection or overwrite a human decision.
        const data = {
          score: suggestion.score,
          explanation:
            suggestion.explanation as unknown as Prisma.InputJsonValue,
          modelVersion,
        };
        const link = await tx.caseLink.upsert({
          where,
          create: { sourceComplaintId, targetComplaintId, ...data },
          update: data,
        });
        saved.push({
          id: link.id,
          status: link.status,
          score: link.score,
          explanation: link.explanation,
          modelVersion: link.modelVersion,
          updatedAt: link.updatedAt,
        });
        await tx.complaint.updateMany({
          where: { id: { in: [source.id, target.id] } },
          data: { overlapReviewStatus: 'PENDING' },
        });
      }
      await tx.auditLog.create({
        data: {
          actorId: principal.id,
          complaintId: source.id,
          event: 'MATCH_ANALYSIS_COMPLETED',
          metadata: {
            suggestedLinkIds: saved.map((s) => s.id),
            modelVersion,
            ruleVersion: 'matching-v1',
          },
        },
      });
      return saved;
    });
  }
}
