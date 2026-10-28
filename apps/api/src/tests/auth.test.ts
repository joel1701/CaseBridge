import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
const { lookup, secret } = vi.hoisted(() => ({
  lookup: vi.fn(),
  secret: 'test-only-not-a-deployable-secret-1234567890',
}));
vi.mock('../lib/env.js', () => ({
  env: { JWT_SECRET: secret, NODE_ENV: 'test', COOKIE_SAME_SITE: 'lax' },
}));
vi.mock('../lib/prisma.js', () => ({
  getPrisma: () => ({
    user: { findUnique: lookup },
    authSession: {
      findUnique: async () => ({
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60000),
      }),
    },
  }),
}));
import { requireAuth, requireRole } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errors.js';
import {
  hashPassword,
  verifyPassword,
  sessionCookieOptions,
} from '../lib/security.js';
const app = express();
app.use(cookieParser());
app.get('/private', requireAuth, requireRole('BUREAU_HEAD'), (req, res) =>
  res.json({ principal: req.principal }),
);
app.use(errorHandler);
function cookie(options: jwt.SignOptions = {}) {
  return `casebridge_session=${jwt.sign({}, secret, { subject: 'user-1', jwtid: 'test-session', issuer: 'casebridge-api', audience: 'casebridge-web', expiresIn: '5m', ...options })}`;
}
afterEach(() => vi.resetAllMocks());
describe('authentication boundaries', () => {
  it('denies missing, expired and wrong-audience tokens without querying DB', async () => {
    expect((await request(app).get('/private')).status).toBe(401);
    expect(
      (
        await request(app)
          .get('/private')
          .set('Cookie', cookie({ expiresIn: -1 }))
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .get('/private')
          .set('Cookie', cookie({ audience: 'other' }))
      ).status,
    ).toBe(401);
    expect(lookup).not.toHaveBeenCalled();
  });
  it('uses current database role and rejects unauthorized roles', async () => {
    lookup.mockResolvedValue({
      id: 'user-1',
      role: 'OFFICER',
      bureauId: 'RB',
      active: true,
    });
    expect(
      (await request(app).get('/private').set('Cookie', cookie())).status,
    ).toBe(403);
    lookup.mockResolvedValue({
      id: 'user-1',
      role: 'BUREAU_HEAD',
      bureauId: 'RB',
      active: true,
    });
    const result = await request(app).get('/private').set('Cookie', cookie());
    expect(result.status).toBe(200);
    expect(result.body.principal.bureauId).toBe('RB');
  });
  it('denies deactivated and unassigned users', async () => {
    lookup.mockResolvedValue({
      id: 'user-1',
      role: 'BUREAU_HEAD',
      bureauId: 'RB',
      active: false,
    });
    expect(
      (await request(app).get('/private').set('Cookie', cookie())).status,
    ).toBe(401);
    lookup.mockResolvedValue({
      id: 'user-1',
      role: 'BUREAU_HEAD',
      bureauId: null,
      active: true,
    });
    expect(
      (await request(app).get('/private').set('Cookie', cookie())).status,
    ).toBe(403);
  });
  it('hashes passwords and guards bcrypt truncation', async () => {
    const hash = await hashPassword('fixture-only-password');
    expect(hash).not.toBe('fixture-only-password');
    expect(await verifyPassword('fixture-only-password', hash)).toBe(true);
    expect(await verifyPassword('incorrect', hash)).toBe(false);
    await expect(hashPassword('é'.repeat(37))).rejects.toThrow();
    expect(sessionCookieOptions.httpOnly).toBe(true);
  }, 20_000);
});
