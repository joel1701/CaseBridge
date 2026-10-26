import { Router } from 'express';
import { AppError } from '../../lib/errors.js';
export const router = Router();
router.get('/complaints', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'complaints is a foundation contract; implementation pending',
    ),
  ),
);
router.post('/complaints', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'complaints is a foundation contract; implementation pending',
    ),
  ),
);
router.post('/complaints/import', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'complaints is a foundation contract; implementation pending',
    ),
  ),
);
router.get('/complaints/:id', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'complaints is a foundation contract; implementation pending',
    ),
  ),
);
