import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import { getPrisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
export type Role = 'ADMIN' | 'BUREAU_HEAD' | 'OFFICER';
export interface Principal {
  id: string;
  role: Role;
  bureauId: string | null;
}
declare module 'express-serve-static-core' {
  interface Request {
    principal?: Principal;
  }
}
export const requireAuth: RequestHandler = async (req, _res, next) => {
  if (!env.JWT_SECRET)
    return next(
      new AppError(
        503,
        'AUTH_NOT_CONFIGURED',
        'Authentication is not configured',
      ),
    );
  const token: unknown = req.cookies?.casebridge_session;
  if (typeof token !== 'string')
    return next(new AppError(401, 'UNAUTHENTICATED', 'Sign in required'));
  let subject: string;
  let sessionId: string;
  try {
    const claims = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'casebridge-api',
      audience: 'casebridge-web',
    });
    if (typeof claims === 'string' || !claims.sub || !claims.exp || !claims.jti)
      throw new Error('Invalid claims');
    subject = claims.sub;
    sessionId = claims.jti!;
  } catch {
    return next(
      new AppError(401, 'UNAUTHENTICATED', 'Session invalid or expired'),
    );
  }
  try {
    const session = await getPrisma().authSession.findUnique({
      where: { id: sessionId },
    });
    if (
      !session ||
      session.userId !== subject ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    )
      return next(
        new AppError(401, 'UNAUTHENTICATED', 'Session invalid or expired'),
      );
    // Reload active role and bureau: JWT role claims are never authorization authority.
    const user = await getPrisma().user.findUnique({ where: { id: subject } });
    if (!user?.active)
      return next(new AppError(401, 'UNAUTHENTICATED', 'Account unavailable'));
    if (user.role !== 'ADMIN' && !user.bureauId)
      return next(new AppError(403, 'FORBIDDEN', 'Bureau assignment required'));
    req.principal = { id: user.id, role: user.role, bureauId: user.bureauId };
    next();
  } catch (error) {
    next(error);
  }
};
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.principal)
      return next(new AppError(401, 'UNAUTHENTICATED', 'Sign in required'));
    if (!roles.includes(req.principal.role))
      return next(new AppError(403, 'FORBIDDEN', 'Role not permitted'));
    next();
  };
/** Always combine this with resource queries, including graph/count/timeline queries. */
export function bureauScope(principal: Principal): { bureauId?: string } {
  if (principal.role === 'ADMIN') return {};
  if (!principal.bureauId)
    throw new AppError(403, 'FORBIDDEN', 'Bureau assignment required');
  return { bureauId: principal.bureauId };
}
