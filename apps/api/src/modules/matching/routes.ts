import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { getPrisma } from '../../lib/prisma.js';
import { idSchema, parseInput } from '../case-links/access.js';
import { HttpSimilarityProvider } from './ai-client.js';
import { PrismaMatchingRepository } from './repository.js';
import { MatchingService } from './service.js';
export const router = Router();
router.post(
  '/intelligence/analyze/:caseId',
  requireAuth,
  requireRole('OFFICER', 'BUREAU_HEAD', 'ADMIN'),
  validateBody(z.strictObject({})),
  async (req, res) => {
    const caseId = parseInput(idSchema, req.params.caseId);
    const service = new MatchingService(
      new PrismaMatchingRepository(getPrisma()),
      new HttpSimilarityProvider(),
    );
    res.json({
      success: true,
      data: await service.analyze(req.principal!, caseId),
    });
  },
);
