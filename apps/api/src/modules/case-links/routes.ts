import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { getPrisma } from '../../lib/prisma.js';
import { idSchema, paginationSchema, parseInput } from './access.js';
import { reviewSchema } from './validation.js';
import { CaseLinkService } from './service.js';
export const router = Router();
router.get(
  '/intelligence/links/:caseId',
  requireAuth,
  requireRole('OFFICER', 'BUREAU_HEAD', 'ADMIN'),
  async (req, res) => {
    const { page, pageSize } = parseInput(paginationSchema, req.query);
    res.json({
      success: true,
      ...(await new CaseLinkService(getPrisma()).list(
        req.principal!,
        parseInput(idSchema, req.params.caseId),
        page,
        pageSize,
      )),
    });
  },
);
router.post(
  '/intelligence/links/:id/review',
  requireAuth,
  requireRole('BUREAU_HEAD', 'ADMIN'),
  validateBody(reviewSchema),
  async (req, res) => {
    res.json({
      success: true,
      data: await new CaseLinkService(getPrisma()).review(
        req.principal!,
        parseInput(idSchema, req.params.id),
        req.body,
      ),
    });
  },
);
