import { Router } from 'express';
import { requireAuth, bureauScope } from '../../middleware/auth.js';
import { getPrisma } from '../../lib/prisma.js';
import {
  idSchema,
  parseInput,
  paginationSchema,
} from '../case-links/access.js';
import { AppError } from '../../lib/errors.js';
import { ComplaintService } from '../complaints/service.js';
import { listSchema } from '../complaints/validation.js';
export const router = Router();
router.get('/bureaus', requireAuth, async (req, res) =>
  res.json({
    success: true,
    data: {
      items: await getPrisma().bureau.findMany({
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
      }),
    },
  }),
);
router.get('/bureaus/:id/officers', requireAuth, async (req, res) => {
  const id = parseInput(idSchema, req.params.id),
    q = parseInput(paginationSchema, req.query);
  if (
    req.principal!.role !== 'ADMIN' &&
    id !== bureauScope(req.principal!).bureauId
  )
    throw new AppError(404, 'NOT_FOUND', 'Bureau not found');
  const where = { bureauId: id, active: true };
  const db = getPrisma();
  const [items, total] = await db.$transaction([
    db.user.findMany({
      where,
      select: { id: true, displayName: true, role: true, bureauId: true },
      orderBy: { id: 'asc' },
      take: q.pageSize,
      skip: (q.page - 1) * q.pageSize,
    }),
    db.user.count({ where }),
  ]);
  res.json({ success: true, data: { items }, meta: { ...q, total } });
});
router.get('/bureaus/:id/queue', requireAuth, async (req, res) => {
  const id = parseInput(idSchema, req.params.id),
    q = parseInput(listSchema, { ...req.query, bureauId: id });
  const { items, total } = await new ComplaintService(getPrisma()).list(
    req.principal!,
    q,
  );
  res.json({
    success: true,
    data: { items },
    meta: { page: q.page, pageSize: q.pageSize, total },
  });
});
