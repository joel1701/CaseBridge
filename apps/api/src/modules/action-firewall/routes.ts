import { Router } from 'express';
import { AppError } from '../../lib/errors.js';
export const router = Router();
router.post('/actions/preview', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'action-firewall is a foundation contract; implementation pending',
    ),
  ),
);
router.post('/actions', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'action-firewall is a foundation contract; implementation pending',
    ),
  ),
);
