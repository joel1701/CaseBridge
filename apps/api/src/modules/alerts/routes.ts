import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { getPrisma } from '../../lib/prisma.js';
import {
  idSchema,
  paginationSchema,
  parseInput,
} from '../case-links/access.js';
import { alertScope, refreshAlerts } from './service.js';
import { AppError } from '../../lib/errors.js';
export const router = Router();
router.get('/alerts', requireAuth, async (req, res) => {
  const q = parseInput(
    paginationSchema.extend({
      unreadOnly: z.enum(['true', 'false']).default('false'),
      resolved: z.enum(['true', 'false', 'all']).default('false'),
    }),
    req.query,
  );
  const where = {
    ...alertScope(req.principal!),
    ...(q.unreadOnly === 'true' ? { readAt: null } : {}),
    ...(q.resolved === 'all'
      ? {}
      : { resolvedAt: q.resolved === 'true' ? { not: null } : null }),
  };
  const db = getPrisma();
  const [items, total] = await db.$transaction(
    [
      db.alert.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      db.alert.count({ where }),
    ],
    { isolationLevel: 'RepeatableRead' },
  );
  res.json({
    success: true,
    data: { items },
    meta: { page: q.page, pageSize: q.pageSize, total },
  });
});
router.post(
  '/alerts/refresh',
  requireAuth,
  requireRole('ADMIN', 'BUREAU_HEAD'),
  async (req, res) => {
    parseInput(z.strictObject({}), req.body ?? {});
    res.json({
      success: true,
      data: await refreshAlerts(getPrisma(), req.principal!),
    });
  },
);
router.patch('/alerts/:id', requireAuth, async (req, res) => {
  const id = parseInput(idSchema, req.params.id),
    body = parseInput(
      z
        .strictObject({
          read: z.boolean().optional(),
          resolved: z.boolean().optional(),
        })
        .refine((v) => Object.keys(v).length > 0, 'Supply a field'),
      req.body,
    );
  const data = await getPrisma().$transaction(async (tx) => {
    const where = { id, ...alertScope(req.principal!) };
    const result = await tx.alert.updateMany({
      where,
      data: {
        ...(body.read !== undefined
          ? { readAt: body.read ? new Date() : null }
          : {}),
        ...(body.resolved !== undefined
          ? { resolvedAt: body.resolved ? new Date() : null }
          : {}),
      },
    });
    if (!result.count) throw new AppError(404, 'NOT_FOUND', 'Alert not found');
    const row = await tx.alert.findFirstOrThrow({ where });
    await tx.auditLog.create({
      data: {
        actorId: req.principal!.id,
        complaintId: row.complaintId,
        event: 'ALERT_UPDATED',
        metadata: {
          read: body.read ?? false,
          resolved: body.resolved ?? false,
        },
      },
    });
    return row;
  });
  res.json({ success: true, data });
});
