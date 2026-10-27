import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { bureauScope, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { errorHandler } from '../middleware/errors.js';
import express from 'express';
import { z } from 'zod';
describe('foundation API', () => {
  it('serves health without DB, JWT or AI', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'CaseBridge API is running',
    });
  });
  it('returns consistent 404 and protected operational endpoints', async () => {
    expect((await request(app).get('/unknown')).body.error.code).toBe(
      'NOT_FOUND',
    );
    expect((await request(app).get('/api/complaints')).status).toBe(
      process.env.JWT_SECRET ? 401 : 503,
    );
  });
  it('rejects malformed JSON', async () => {
    const r = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{');
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('INVALID_JSON');
  });
  it('rejects foreign and missing origins on writes', async () => {
    for (const origin of ['', 'https://evil.example']) {
      const r = await request(app)
        .post('/api/complaints')
        .set('Origin', origin)
        .send({});
      expect(r.status).toBe(403);
    }
  });
  it('requires authentication after the trusted-origin check', async () => {
    expect(
      (
        await request(app)
          .post('/api/complaints')
          .set('Origin', 'http://localhost:5173')
          .send({})
      ).status,
    ).toBe(process.env.JWT_SECRET ? 401 : 503);
  });
  it('does not echo an untrusted CORS origin', async () => {
    const r = await request(app)
      .get('/api/health')
      .set('Origin', 'https://evil.example');
    expect(r.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
  });
  it('scopes non-admins and denies missing bureau', () => {
    expect(bureauScope({ id: 'u', role: 'OFFICER', bureauId: 'RB' })).toEqual({
      bureauId: 'RB',
    });
    expect(() =>
      bureauScope({ id: 'u', role: 'OFFICER', bureauId: null }),
    ).toThrow();
    expect(bureauScope({ id: 'a', role: 'ADMIN', bureauId: null })).toEqual({});
  });
  it('rejects unauthenticated role access and invalid payloads', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get('/protected', requireRole('ADMIN'), (_q, r) => r.json({}));
    testApp.post(
      '/validated',
      validateBody(z.object({ name: z.string().min(1) })),
      (_q, r) => r.json({}),
    );
    testApp.use(errorHandler);
    expect((await request(testApp).get('/protected')).status).toBe(401);
    expect(
      (await request(testApp).post('/validated').send({ name: '' })).body.error
        .code,
    ).toBe('VALIDATION_ERROR');
  });
});
