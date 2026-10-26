import { Router } from 'express';
import { AppError } from '../../lib/errors.js';
export const router = Router();
router.get('/institutions/:id', (_req, _res, next) =>
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'institutions is a foundation contract; implementation pending',
    ),
  ),
);
