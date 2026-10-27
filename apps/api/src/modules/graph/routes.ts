import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { getPrisma } from '../../lib/prisma.js';
import { idSchema, parseInput } from '../case-links/access.js';
import { GraphService } from './service.js';
export const router = Router();
router.get(
  '/intelligence/graph/:institutionId',
  requireAuth,
  requireRole('OFFICER', 'BUREAU_HEAD', 'ADMIN'),
  async (req, res) => {
    parseInput(z.strictObject({}), req.query);
    res.json({
      success: true,
      data: await new GraphService(getPrisma()).get(
        req.principal!,
        parseInput(idSchema, req.params.institutionId),
      ),
    });
  },
);
