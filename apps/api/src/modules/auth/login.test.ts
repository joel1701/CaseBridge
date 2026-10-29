import { beforeEach, it, expect, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  counter: vi.fn(),
  session: vi.fn(),
  create: vi.fn(),
  revoke: vi.fn(),
  audit: vi.fn(),
  throttleReset: vi.fn(),
  secret: crypto.randomUUID() + crypto.randomUUID(),
}));
vi.mock('../../lib/env.js', () => ({
  env: {
    JWT_SECRET: mocks.secret,
    NODE_ENV: 'test',
    COOKIE_SAME_SITE: 'lax',
    FRONTEND_URL: 'http://localhost:5173',
  },
}));
vi.mock('../../lib/prisma.js', () => ({
  getPrisma: () => ({
    user: { findUnique: mocks.user, findUniqueOrThrow: mocks.user },
    $queryRaw: mocks.counter,
    authSession: { findUnique: mocks.session, updateMany: mocks.revoke },
    $transaction: async (work: (tx: unknown) => unknown) =>
      work({
        authSession: { create: mocks.create, updateMany: mocks.revoke },
        auditLog: { create: mocks.audit },
        loginThrottle: { deleteMany: mocks.throttleReset },
      }),
  }),
}));
import { app } from '../../app.js';
import { hashPassword } from '../../lib/security.js';
const user = {
  id: 'u',
  displayName: 'Test',
  role: 'OFFICER',
  bureauId: 'PGRC',
  active: true,
};
const post = (path: string, body: object) =>
  request(app).post(path).set('Origin', 'http://localhost:5173').send(body);
beforeEach(() => {
  vi.resetAllMocks();
  mocks.counter.mockResolvedValue([{ attempts: 1 }]);
  mocks.revoke.mockResolvedValue({ count: 1 });
});
it('logs in with bcrypt, sends only an HttpOnly cookie, and reloads the active account', async () => {
  const password = 'test-only-' + randomUUID();
  mocks.user.mockResolvedValue({
    ...user,
    passwordHash: await hashPassword(password),
  });
  const result = await post('/api/auth/login', {
    email: '  OFFICER@example.invalid ',
    password,
  });
  expect(result.status).toBe(200);
  expect(result.body).toEqual({
    success: true,
    data: {
      user: { id: 'u', displayName: 'Test', role: 'OFFICER', bureauId: 'PGRC' },
    },
  });
  expect(mocks.user).toHaveBeenCalledWith({
    where: { email: 'officer@example.invalid' },
  });
  // Success clears only the hashed account counter, never the per-IP window.
  expect(mocks.throttleReset).toHaveBeenCalledTimes(1);
  expect(mocks.throttleReset).toHaveBeenCalledWith({
    where: {
      key: createHash('sha256')
        .update('account:officer@example.invalid')
        .digest('hex'),
    },
  });
  const cookie = result.headers['set-cookie'][0];
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('SameSite=Lax');
  expect(cookie).not.toContain(password);
  const claims = jwt.verify(
    cookie.split(';')[0].split('=')[1],
    mocks.secret,
  ) as jwt.JwtPayload;
  expect(claims.jti).toBeTruthy();
  mocks.session.mockResolvedValue({
    userId: 'u',
    expiresAt: new Date(Date.now() + 60000),
    revokedAt: null,
  });
  expect(
    (await request(app).get('/api/auth/me').set('Cookie', cookie)).status,
  ).toBe(200);
  expect(mocks.create).toHaveBeenCalled();
});
it('logout revokes the token and a replay is denied', async () => {
  const token = jwt.sign({}, mocks.secret, {
    subject: 'u',
    jwtid: 'session',
    issuer: 'setu-api',
    audience: 'setu-web',
    expiresIn: '1h',
  });
  const result = await post('/api/auth/logout', {}).set(
    'Cookie',
    `setu_session=${token}`,
  );
  expect(result.status).toBe(200);
  expect(result.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
  expect(mocks.revoke).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'session', userId: 'u', revokedAt: null },
    }),
  );
  mocks.session.mockResolvedValue({
    userId: 'u',
    expiresAt: new Date(Date.now() + 60000),
    revokedAt: new Date(),
  });
  expect(
    (
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', `setu_session=${token}`)
    ).status,
  ).toBe(401);
});
it('rejects wrong credentials, unknown fields, overlong passwords and throttled attempts', async () => {
  mocks.user.mockResolvedValue(null);
  expect(
    (
      await post('/api/auth/login', {
        email: 'unknown@example.invalid',
        password: 'invalid',
      })
    ).status,
  ).toBe(401);
  expect(
    (
      await post('/api/auth/login', {
        email: 'a@example.invalid',
        password: 'é'.repeat(37),
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await post('/api/auth/login', {
        email: 'a@example.invalid',
        password: 'x',
        role: 'ADMIN',
      })
    ).status,
  ).toBe(400);
  mocks.counter.mockResolvedValue([{ attempts: 100 }]);
  expect(
    (
      await post('/api/auth/login', {
        email: 'a@example.invalid',
        password: 'x',
      })
    ).status,
  ).toBe(429);
});
