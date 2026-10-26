import { Router } from 'express';
import { AppError } from '../../lib/errors.js';
export const router = Router();
router.get('/intelligence/links/:caseId', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'case-links is a foundation contract; implementation pending',
    ),
  ),
);
router.post('/intelligence/links/:id/review', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'case-links is a foundation contract; implementation pending',
    ),
  ),
);
