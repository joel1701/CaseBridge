import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import { bureauScope, type Principal } from '../../middleware/auth.js';
import { z } from 'zod';
export const reportSchema = z
  .strictObject({
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
  })
  .refine(
    (q) => !q.from || !q.to || Date.parse(q.from) <= Date.parse(q.to),
    'from must be before to',
  );
export async function summary(
  db: PrismaClient,
  p: Principal,
  q: z.infer<typeof reportSchema> = {},
) {
  const scope = bureauScope(p);
  const now = new Date();
  const where: Prisma.ComplaintWhereInput = {
    ...scope,
    ...(q.from || q.to
      ? {
          createdAt: {
            gte: q.from ? new Date(q.from) : undefined,
            lte: q.to ? new Date(q.to) : undefined,
          },
        }
      : {}),
  };
  return db.$transaction(
    async (tx) => {
      const [
        totalComplaints,
        byStatusRows,
        byBureau,
        byCategory,
        byInstitution,
        overdueCount,
        pendingOverlapReviews,
        activeActions,
      ] = await Promise.all([
        tx.complaint.count({ where }),
        tx.complaint.groupBy({ by: ['status'], where, _count: true }),
        tx.complaint.groupBy({ by: ['bureauId'], where, _count: true }),
        tx.complaint.groupBy({ by: ['category'], where, _count: true }),
        tx.complaint.groupBy({ by: ['institutionId'], where, _count: true }),
        tx.complaint.count({
          where: { ...where, status: { not: 'DISPOSED' }, dueAt: { lt: now } },
        }),
        tx.complaint.count({
          where: { ...where, overlapReviewStatus: 'PENDING' },
        }),
        tx.investigationAction.count({
          where: {
            ...scope,
            complaint: where,
            status: { in: ['PLANNED', 'IN_PROGRESS'] },
          },
        }),
      ]);
      const filters = Prisma.sql`WHERE 1=1 ${scope.bureauId ? Prisma.sql`AND "bureauId"=${scope.bureauId}` : Prisma.empty} ${q.from ? Prisma.sql`AND "createdAt">=${new Date(q.from)}` : Prisma.empty} ${q.to ? Prisma.sql`AND "createdAt"<=${new Date(q.to)}` : Prisma.empty}`;
      const trends = await tx.$queryRaw<
        Array<{ month: string; count: number }>
      >(
        Prisma.sql`SELECT to_char(date_trunc('month',"createdAt"),'YYYY-MM') AS month,COUNT(*)::int AS count FROM "Complaint" ${filters} GROUP BY 1 ORDER BY 1`,
      );
      const resolution = await tx.$queryRaw<Array<{ hours: number | null }>>(
        Prisma.sql`SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt"-"createdAt"))/3600)::float8 AS hours FROM "Complaint" ${filters} AND "status"='DISPOSED' AND "resolvedAt">="createdAt"`,
      );
      const byStatus: Record<string, number> = {
        RECEIVED: 0,
        UNDER_PROCESS: 0,
        TRANSFERRED: 0,
        ESCALATED: 0,
        DISPOSED: 0,
      };
      for (const row of byStatusRows) byStatus[row.status] = row._count;
      return {
        scope: 'AUTHORIZED',
        totalComplaints,
        pendingComplaints: totalComplaints - byStatus.DISPOSED,
        disposedComplaints: byStatus.DISPOSED,
        escalatedComplaints: byStatus.ESCALATED,
        overdueCount,
        pendingOverlapReviews,
        activeActions,
        byStatus,
        byBureau,
        byCategory,
        byInstitution,
        trends,
        averageResolutionHours: resolution[0]?.hours ?? null,
        coordinationRequiredCount: (
          await tx.$queryRaw<Array<{ count: number }>>(
            Prisma.sql`SELECT COUNT(*)::int AS count FROM "Complaint" ${filters} AND EXISTS (SELECT 1 FROM "CaseLink" l JOIN "Complaint" other ON other.id = CASE WHEN l."sourceComplaintId"="Complaint".id THEN l."targetComplaintId" ELSE l."sourceComplaintId" END WHERE (l."sourceComplaintId"="Complaint".id OR l."targetComplaintId"="Complaint".id) AND l.status IN ('SUGGESTED','CONFIRMED') AND other."bureauId" <> "Complaint"."bureauId")`,
          )
        )[0].count,
      };
    },
    { isolationLevel: 'RepeatableRead' },
  );
}
