import { Router } from 'express';
import {
  requireAuth,
  requireRole,
  bureauScope,
} from '../../middleware/auth.js';
import { getPrisma } from '../../lib/prisma.js';
import {
  idSchema,
  parseInput,
  paginationSchema,
  authorizedComplaint,
} from '../case-links/access.js';
import { ComplaintService } from './service.js';
import {
  createSchema,
  listSchema,
  importSchema,
  changeSchema,
  archiveSchema,
  parseCsv,
} from './validation.js';
export const router = Router();
const service = () => new ComplaintService(getPrisma());
router.get('/complaints', requireAuth, async (req, res) => {
  const q = parseInput(listSchema, req.query);
  const { items, total } = await service().list(req.principal!, q);
  res.json({
    success: true,
    data: { items },
    meta: { page: q.page, pageSize: q.pageSize, total },
  });
});
router.post('/complaints', requireAuth, async (req, res) => {
  const data = await service().createMany(req.principal!, [
    parseInput(createSchema, req.body),
  ]);
  res.status(201).json({ success: true, data: data[0] });
});
router.post(
  '/complaints/import',
  requireAuth,
  requireRole('ADMIN', 'BUREAU_HEAD'),
  async (req, res) => {
    const { items } = parseInput(importSchema, req.body);
    const rows = await service().createMany(req.principal!, items);
    res.status(201).json({
      success: true,
      data: { createdIds: rows.map((r) => r.id), count: rows.length },
    });
  },
);
router.post(
  '/complaints/import/csv',
  requireAuth,
  requireRole('ADMIN', 'BUREAU_HEAD'),
  async (req, res) => {
    const rows = await service().createMany(req.principal!, parseCsv(req.body));
    res.status(201).json({
      success: true,
      data: { createdIds: rows.map((r) => r.id), count: rows.length },
    });
  },
);
router.get('/complaints/:id', requireAuth, async (req, res) =>
  res.json({
    success: true,
    data: await service().detail(
      req.principal!,
      parseInput(idSchema, req.params.id),
    ),
  }),
);
router.patch('/complaints/:id', requireAuth, async (req, res) =>
  res.json({
    success: true,
    data: await service().update(
      req.principal!,
      parseInput(idSchema, req.params.id),
      parseInput(changeSchema, req.body),
    ),
  }),
);
router.delete(
  '/complaints/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    const body = parseInput(archiveSchema, req.body);
    res.json({
      success: true,
      data: await service().archive(
        req.principal!,
        parseInput(idSchema, req.params.id),
        body.expectedVersion,
        body.reason,
      ),
    });
  },
);

router.get('/complaints/:id/actions', requireAuth, async (req, res) => {
  const id = parseInput(idSchema, req.params.id),
    q = parseInput(paginationSchema, req.query),
    p = req.principal!;
  const { items, total } = await getPrisma().$transaction(
    async (tx) => {
      await authorizedComplaint(tx, p, id);
      const where = { complaintId: id, ...bureauScope(p) };
      const [items, total] = await Promise.all([
        tx.investigationAction.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
        }),
        tx.investigationAction.count({ where }),
      ]);
      return { items, total };
    },
    { isolationLevel: 'RepeatableRead' },
  );
  res.json({ success: true, data: { items }, meta: { ...q, total } });
});
