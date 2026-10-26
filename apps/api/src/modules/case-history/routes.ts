import { Router } from 'express';
import { AppError } from '../../lib/errors.js';
export const router = Router();
router.get('/complaints/:id/timeline', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'case-history is a foundation contract; implementation pending',
    ),
  ),
);
