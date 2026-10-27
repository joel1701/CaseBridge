import type { PrismaClient, Prisma } from '../../generated/prisma/client.js';
import { bureauScope, type Principal } from '../../middleware/auth.js';
import { withInstitutions } from '../complaints/transaction.js';
import { z } from 'zod';
export function alertScope(p: Principal): Prisma.AlertWhereInput {
  return {
    ...bureauScope(p),
    OR: [{ complaintId: null }, { complaint: bureauScope(p) }],
  };
}
export function desiredAlerts(
  c: {
    id: string;
    status: string;
    archivedAt: Date | null;
    dueAt: Date | null;
    overlapReviewStatus: string;
  },
  now: Date,
  hours: number,
) {
  const result: Array<{
    key: string;
    type: 'DEADLINE' | 'OVERLAP';
    message: string;
  }> = [];
  if (c.status === 'DISPOSED' || c.archivedAt) return result;
  if (c.dueAt && c.dueAt.getTime() <= now.getTime() + hours * 3600000) {
    const stage = c.dueAt < now ? 'overdue' : 'approaching';
    result.push({
      key: `deadline:${c.id}:${c.dueAt.toISOString()}:${stage}`,
      type: 'DEADLINE',
      message:
        stage === 'overdue'
          ? 'Complaint deadline overdue'
          : 'Complaint deadline approaching',
    });
  }
  if (c.overlapReviewStatus === 'PENDING')
    result.push({
      key: `review:${c.id}`,
      type: 'OVERLAP',
      message: 'Case relationship awaits authorized review',
    });
  return result;
}
export async function refreshAlerts(db: PrismaClient, p: Principal) {
  const hours = z.coerce
    .number()
    .int()
    .min(1)
    .max(720)
    .parse(process.env.DEADLINE_ALERT_HOURS ?? 48);
  let cursor: string | undefined;
  let processed = 0;
  while (true) {
    const batch = await db.complaint.findMany({
      where: bureauScope(p),
      select: { id: true, institutionId: true },
      orderBy: { id: 'asc' },
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (!batch.length) break;
    for (const entry of batch)
      await withInstitutions(db, [entry.institutionId], async (tx) => {
        const c = await tx.complaint.findFirst({
          where: { id: entry.id, ...bureauScope(p) },
        });
        if (!c || c.institutionId !== entry.institutionId) return;
        const wanted = desiredAlerts(c, new Date(), hours),
          keys = wanted.map((a) => a.key);
        await tx.alert.updateMany({
          where: {
            complaintId: c.id,
            type: { in: ['DEADLINE', 'OVERLAP'] },
            resolvedAt: null,
            ...(keys.length ? { dedupeKey: { notIn: keys } } : {}),
          },
          data: { resolvedAt: new Date() },
        });
        for (const a of wanted)
          await tx.alert.upsert({
            where: { dedupeKey: a.key },
            create: {
              bureauId: c.bureauId,
              complaintId: c.id,
              userId: c.assignedToId,
              dedupeKey: a.key,
              type: a.type,
              message: a.message,
            },
            update: { bureauId: c.bureauId, userId: c.assignedToId },
          });
      });
    processed += batch.length;
    cursor = batch.at(-1)!.id;
  }
  return { processed };
}
