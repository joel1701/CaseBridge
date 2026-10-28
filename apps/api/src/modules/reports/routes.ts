import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getPrisma } from '../../lib/prisma.js';
import { parseInput } from '../case-links/access.js';
import { summary, reportSchema } from './service.js';
export const router = Router();
for (const path of ['/dashboard/summary', '/reports/summary'])
  router.get(path, requireAuth, async (req, res) =>
    res.json({
      success: true,
      data: await summary(
        getPrisma(),
        req.principal!,
        parseInput(reportSchema, req.query),
      ),
    }),
  );
