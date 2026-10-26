import { Router } from 'express';
import { AppError } from '../../lib/errors.js';
export const router = Router();
router.post('/auth/login', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'auth is a foundation contract; implementation pending',
    ),
  ),
);
router.get('/auth/me', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'auth is a foundation contract; implementation pending',
    ),
  ),
);
router.post('/auth/logout', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'auth is a foundation contract; implementation pending',
    ),
  ),
);
