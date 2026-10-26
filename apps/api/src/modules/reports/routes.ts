import { Router } from 'express';
import { AppError } from '../../lib/errors.js';
export const router = Router();
router.get('/dashboard/summary', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'reports is a foundation contract; implementation pending',
    ),
  ),
);
router.get('/reports/summary', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'reports is a foundation contract; implementation pending',
    ),
  ),
);
