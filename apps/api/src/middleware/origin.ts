import type { RequestHandler } from 'express';
import { env } from '../lib/env.js';
import { AppError } from '../lib/errors.js';
/** Cookie-authenticated writes require exact trusted Origin. CORS alone is not CSRF protection. */
export const requireTrustedOrigin: RequestHandler = (req, _res, next) => {
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.get('origin') !== new URL(env.FRONTEND_URL).origin
  )
    return next(
      new AppError(403, 'UNTRUSTED_ORIGIN', 'Trusted frontend Origin required'),
    );
  next();
};
