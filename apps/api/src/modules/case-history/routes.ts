import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getPrisma } from '../../lib/prisma.js';
import {
  parseInput,
  idSchema,
  paginationSchema,
} from '../case-links/access.js';
import { timeline } from './service.js';
export const router = Router();
router.get('/complaints/:id/timeline', requireAuth, async (req, res) => {
  const id = parseInput(idSchema, req.params.id),
    q = parseInput(paginationSchema, req.query);
  const { items, total } = await getPrisma().$transaction(
    (tx) => timeline(tx, req.principal!, id, q.page, q.pageSize),
    { isolationLevel: 'RepeatableRead' },
  );
  res.json({ success: true, data: { items }, meta: { ...q, total } });
});
