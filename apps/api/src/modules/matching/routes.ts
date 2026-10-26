import { Router } from 'express';
import { AppError } from '../../lib/errors.js';
export const router = Router();
router.post('/intelligence/analyze/:caseId', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'matching is a foundation contract; implementation pending',
    ),
  ),
);
