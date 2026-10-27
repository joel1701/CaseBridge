import { Router } from 'express';
import { z } from 'zod';
import { getPrisma } from '../../lib/prisma.js';
import { sessionCookieOptions } from '../../lib/security.js';
import { requireAuth } from '../../middleware/auth.js';
import { parseInput } from '../case-links/access.js';
import { login, logout, publicUser } from './service.js';
export const router = Router();
export const loginSchema = z.strictObject({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z
    .string()
    .min(1)
    .refine(
      (v) => Buffer.byteLength(v, 'utf8') <= 72,
      'Password exceeds 72 bytes',
    ),
});
router.post('/auth/login', async (req, res) => {
  const body = parseInput(loginSchema, req.body);
  const result = await login(
    getPrisma(),
    body.email,
    body.password,
    req.ip ?? 'unknown',
  );
  res
    .set('Cache-Control', 'no-store')
    .cookie('casebridge_session', result.token, sessionCookieOptions)
    .json({ success: true, data: { user: result.user } });
});
router.get('/auth/me', requireAuth, async (req, res) => {
  const user = await getPrisma().user.findUniqueOrThrow({
    where: { id: req.principal!.id },
  });
  res
    .set('Cache-Control', 'no-store')
    .json({ success: true, data: publicUser(user) });
});
router.post('/auth/logout', async (req, res) => {
  parseInput(z.strictObject({}), req.body ?? {});
  await logout(getPrisma(), req.cookies?.casebridge_session);
  const options = { ...sessionCookieOptions };
  delete options.maxAge;
  res
    .set('Cache-Control', 'no-store')
    .clearCookie('casebridge_session', options)
    .json({ success: true, data: { loggedOut: true } });
});
