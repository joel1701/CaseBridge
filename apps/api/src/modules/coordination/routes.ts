import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { getPrisma } from '../../lib/prisma.js';
import { coordinationSchema } from './validation.js';
import { CoordinationService } from './service.js';
export const router = Router();
router.post(
  '/coordination',
  requireAuth,
  requireRole('BUREAU_HEAD', 'ADMIN'),
  validateBody(coordinationSchema),
  async (req, res) => {
    res.status(201).json({
      success: true,
      data: await new CoordinationService(getPrisma()).record(
        req.principal!,
        req.body,
      ),
    });
  },
);
