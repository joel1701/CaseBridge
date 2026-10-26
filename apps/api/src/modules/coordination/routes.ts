import { Router } from 'express';
import { AppError } from '../../lib/errors.js';
export const router = Router();
router.post('/coordination', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'coordination is a foundation contract; implementation pending',
    ),
  ),
);
