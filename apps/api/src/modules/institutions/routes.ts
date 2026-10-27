import { Router } from 'express';
import { requireAuth, bureauScope } from '../../middleware/auth.js';
import { getPrisma } from '../../lib/prisma.js';
import {
  parseInput,
  idSchema,
  paginationSchema,
} from '../case-links/access.js';
import { AppError } from '../../lib/errors.js';
import { z } from 'zod';
export const router = Router();
router.get('/institutions', requireAuth, async (req, res) => {
  const q = parseInput(
    paginationSchema.extend({ q: z.string().trim().max(200).optional() }),
    req.query,
  );
  const where = q.q
    ? {
        OR: [
          { name: { contains: q.q, mode: 'insensitive' as const } },
          { permanentId: { contains: q.q, mode: 'insensitive' as const } },
        ],
      }
    : {};
  const [items, total] = await getPrisma().$transaction([
    getPrisma().institution.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    getPrisma().institution.count({ where }),
  ]);
  res.json({
    success: true,
    data: { items },
    meta: { page: q.page, pageSize: q.pageSize, total },
  });
});
router.get('/institutions/:id', requireAuth, async (req, res) => {
  const id = parseInput(idSchema, req.params.id),
    scope = bureauScope(req.principal!);
  const data = await getPrisma().$transaction(
    async (tx) => {
      const institution = await tx.institution.findUnique({ where: { id } });
      if (!institution)
        throw new AppError(404, 'NOT_FOUND', 'Institution not found');
      const where = { institutionId: id, ...scope };
      const [authorizedComplaintCount, byStatus, byBureau, recentComplaints] =
        await Promise.all([
          tx.complaint.count({ where }),
          tx.complaint.groupBy({ by: ['status'], where, _count: true }),
          tx.complaint.groupBy({ by: ['bureauId'], where, _count: true }),
          tx.complaint.findMany({
            where,
            select: {
              id: true,
              originalId: true,
              title: true,
              bureauId: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          }),
        ]);
      return {
        ...institution,
        authorizedComplaintCount,
        byStatus,
        byBureau,
        recentComplaints,
      };
    },
    { isolationLevel: 'RepeatableRead' },
  );
  res.json({ success: true, data });
});
