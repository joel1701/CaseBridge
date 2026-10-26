import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../lib/errors.js';
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(
        new AppError(
          400,
          'VALIDATION_ERROR',
          'Request validation failed',
          parsed.error.issues.map(({ path, message }) => ({ path, message })),
        ),
      );
      return;
    }
    req.body = parsed.data;
    next();
  };
