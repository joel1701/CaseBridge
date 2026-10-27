import { it, expect, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
const { findUser, secret } = vi.hoisted(() => ({
  findUser: vi.fn(),
  secret: crypto.randomUUID() + crypto.randomUUID(),
}));
vi.mock('../../lib/env.js', () => ({
  env: {
    JWT_SECRET: secret,
    NODE_ENV: 'test',
    FRONTEND_URL: 'http://localhost:5173',
    AI_SERVICE_URL: 'http://localhost:8000',
  },
}));
vi.mock('../../lib/prisma.js', () => ({
  getPrisma: () => ({ user: { findUnique: findUser } }),
}));
import { app } from '../../app.js';
function cookie() {
  return `casebridge_session=${jwt.sign({}, secret, { subject: 'officer', issuer: 'casebridge-api', audience: 'casebridge-web', expiresIn: '5m' })}`;
}
const paths = [
  ['post', '/api/intelligence/analyze/c1'],
  ['get', '/api/intelligence/links/c1'],
  ['post', '/api/intelligence/links/l1/review'],
  ['get', '/api/intelligence/graph/i1'],
  ['post', '/api/actions/preview'],
  ['post', '/api/actions'],
  ['post', '/api/coordination'],
] as const;
it('guards all seven real routers with shared authentication', async () => {
  for (const [method, path] of paths) {
    const client = request(app);
    const response = await client[method](path).set(
      'Origin',
      'http://localhost:5173',
    );
    expect(response.status).toBe(401);
  }
});
it('rejects officer review/coordination, forged ownership, malformed proposals and invalid pagination', async () => {
  findUser.mockResolvedValue({
    id: 'officer',
    role: 'OFFICER',
    bureauId: 'PGRC',
    active: true,
  });
  for (const path of ['/api/intelligence/links/l1/review', '/api/coordination'])
    expect(
      (
        await request(app)
          .post(path)
          .set('Origin', 'http://localhost:5173')
          .set('Cookie', cookie())
          .send({})
      ).status,
    ).toBe(403);
  for (const path of [
    '/api/actions',
    '/api/actions/preview',
    '/api/intelligence/analyze/c1',
  ])
    expect(
      (
        await request(app)
          .post(path)
          .set('Origin', 'http://localhost:5173')
          .set('Cookie', cookie())
          .send({ bureauId: 'RB' })
      ).status,
    ).toBe(400);
  expect(
    (
      await request(app)
        .get('/api/intelligence/links/c1?page=0')
        .set('Cookie', cookie())
    ).status,
  ).toBe(400);
});
