import type { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/errors.js';
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    if (error.status === 429) res.set('Retry-After', '900');
    res.status(error.status).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }
  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_JSON', message: 'Invalid JSON body' },
    });
    return;
  }
  if (error?.type === 'entity.too.large') {
    res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body exceeds 1 MB',
      },
    });
    return;
  }
  if (error?.code === 'P2002') {
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_REFERENCE',
        message: 'A record with this unique reference already exists',
      },
    });
    return;
  }
  if (['P1001', 'P1002', 'P1017', 'P2028', 'P2034'].includes(error?.code)) {
    res.status(503).json({
      success: false,
      error: {
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'Database unavailable or busy; retry',
      },
    });
    return;
  }
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
