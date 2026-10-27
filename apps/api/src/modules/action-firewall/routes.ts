import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { getPrisma } from '../../lib/prisma.js';
import { createActionSchema, previewSchema } from './validation.js';
import { FirewallService } from './service.js';
import { PrismaFirewallRepository } from './repository.js';
export const router = Router();
const roles = requireRole('OFFICER', 'BUREAU_HEAD', 'ADMIN');
router.post(
  '/actions/preview',
  requireAuth,
  roles,
  validateBody(previewSchema),
  async (req, res) => {
    res.json({
      success: true,
      data: await new FirewallService(
        new PrismaFirewallRepository(getPrisma()),
      ).preview(req.principal!, req.body),
    });
  },
);
router.post(
  '/actions',
  requireAuth,
  roles,
  validateBody(createActionSchema),
  async (req, res) => {
    res.status(201).json({
      success: true,
      data: await new FirewallService(
        new PrismaFirewallRepository(getPrisma()),
      ).create(req.principal!, req.body),
    });
  },
);
