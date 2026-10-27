/** Requires an explicitly supplied disposable PostgreSQL database; never uses DATABASE_URL implicitly. */
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
vi.hoisted(() => {
  if (process.env.CASEBRIDGE_TEST_DATABASE_URL)
    process.env.DATABASE_URL = process.env.CASEBRIDGE_TEST_DATABASE_URL;
  process.env.JWT_SECRET = crypto.randomUUID() + crypto.randomUUID();
  process.env.NODE_ENV = 'test';
  process.env.FRONTEND_URL = 'http://localhost:5173';
});
import { app } from '../../app.js';
import { env } from '../../lib/env.js';
import { getPrisma, disconnectPrisma } from '../../lib/prisma.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { FirewallService } from '../action-firewall/service.js';
import { PrismaFirewallRepository } from '../action-firewall/repository.js';
import type { FirewallRepository } from '../action-firewall/types.js';
const enabled = Boolean(process.env.CASEBRIDGE_TEST_DATABASE_URL);
const prefix = `test-${randomUUID()}`;
const id = (value: string) => `${prefix}-${value}`;
const pgOfficer = {
  id: id('officer'),
  role: 'OFFICER' as const,
  bureauId: id('PGRC'),
};
const pgHead = {
  id: id('head'),
  role: 'BUREAU_HEAD' as const,
  bureauId: id('PGRC'),
};
const rbHead = {
  id: id('rbhead'),
  role: 'BUREAU_HEAD' as const,
  bureauId: id('RB'),
};
const outsider = {
  id: id('outside'),
  role: 'BUREAU_HEAD' as const,
  bureauId: id('OTHER'),
};
const admin = { id: id('admin'), role: 'ADMIN' as const, bureauId: null };
function cookie(user: { id: string }) {
  return `casebridge_session=${jwt.sign({}, env.JWT_SECRET!, { subject: user.id, jwtid: id(`session-${user.id}`), issuer: 'casebridge-api', audience: 'casebridge-web', expiresIn: '10m' })}`;
}
function post(path: string, user: { id: string }, body: unknown) {
  return request(app)
    .post(path)
    .set('Cookie', cookie(user))
    .set('Origin', env.FRONTEND_URL)
    .send(body as object);
}
function get(path: string, user: { id: string }) {
  return request(app).get(path).set('Cookie', cookie(user));
}
let db: PrismaClient;
describe.skipIf(!enabled)('PostgreSQL intelligence integration', () => {
  beforeAll(async () => {
    db = getPrisma();
    for (const code of ['PGRC', 'RB', 'OTHER'])
      await db.bureau.create({
        data: { id: id(code), code: id(code), name: `Integration ${code}` },
      });
    for (const principal of [pgOfficer, pgHead, rbHead, outsider, admin])
      await db.user.create({
        data: {
          ...principal,
          email: `${principal.id}@example.invalid`,
          displayName: 'Synthetic test officer',
          passwordHash: 'not-a-login-hash',
        },
      });
    for (const user of [pgOfficer, pgHead, rbHead, outsider, admin])
      await db.authSession.create({
        data: {
          id: id(`session-${user.id}`),
          userId: user.id,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
    const root = new URL('../../../../../', import.meta.url);
    const institutions = z
      .array(
        z.object({
          id: z.string(),
          permanentId: z.string(),
          name: z.string(),
          state: z.string(),
        }),
      )
      .parse(
        parse(
          await readFile(new URL('data/sample_institutions.csv', root), 'utf8'),
          { columns: true, skip_empty_lines: true },
        ),
      );
    for (const row of institutions)
      await db.institution.create({
        data: { ...row, id: id(row.id), permanentId: id(row.permanentId) },
      });
    const complaints = z
      .array(
        z.object({
          id: z.string(),
          originalId: z.string(),
          institutionId: z.string(),
          bureauId: z.string(),
          title: z.string(),
          description: z.string(),
          category: z.string(),
        }),
      )
      .parse(
        parse(
          await readFile(new URL('data/sample_complaints.csv', root), 'utf8'),
          { columns: true, skip_empty_lines: true },
        ),
      );
    for (const row of complaints)
      await db.complaint.create({
        data: {
          ...row,
          id: id(row.id),
          institutionId: id(row.institutionId),
          bureauId: id(row.bureauId),
          sourceBureauId: id(row.bureauId),
        },
      });
  }, 30000);
  afterAll(async () => {
    if (!db) return;
    // Only records created under this run's random prefix are removed.
    const complaints = { startsWith: prefix };
    await db.auditLog.deleteMany({
      where: { actorId: { startsWith: prefix } },
    });
    await db.coordinationDecision.deleteMany({
      where: { decidedById: { startsWith: prefix } },
    });
    await db.caseLink.deleteMany({ where: { sourceComplaintId: complaints } });
    await db.investigationAction.deleteMany({
      where: { complaintId: complaints },
    });
    await db.complaint.deleteMany({ where: { id: complaints } });
    await db.institution.deleteMany({ where: { id: complaints } });
    await db.user.deleteMany({ where: { id: complaints } });
    await db.bureau.deleteMany({ where: { id: complaints } });
    await disconnectPrisma();
  }, 30000);
  it('authenticates all seven endpoints and denies out-of-scope source records', async () => {
    expect(
      (await request(app).get(`/api/intelligence/links/${id('cmp-001')}`))
        .status,
    ).toBe(401);
    for (const path of [
      `/api/intelligence/links/${id('cmp-001')}`,
      `/api/intelligence/graph/${id('inst-01')}`,
    ])
      expect((await get(path, outsider)).status).toBe(404);
    expect(
      (await post(`/api/intelligence/analyze/${id('cmp-001')}`, rbHead, {}))
        .status,
    ).toBe(404);
    expect(
      (
        await post('/api/actions/preview', rbHead, {
          complaintId: id('cmp-001'),
          type: 'REVIEW',
          summary: 'Review',
        })
      ).status,
    ).toBe(404);
  });
  it.skipIf(process.env.CASEBRIDGE_TEST_AI !== '1')(
    'runs real authenticated FastAPI analysis and saves explainable suggestions',
    async () => {
      const result = await post(
        `/api/intelligence/analyze/${id('cmp-001')}`,
        pgOfficer,
        {},
      );
      expect(result.status, JSON.stringify(result.body)).toBe(200);
      expect(result.body.data.suggestions.length).toBeGreaterThan(0);
      const link = await db.caseLink.findUnique({
        where: {
          sourceComplaintId_targetComplaintId: {
            sourceComplaintId: id('cmp-001'),
            targetComplaintId: id('cmp-002'),
          },
        },
      });
      expect(link?.status).toBe('SUGGESTED');
      expect(link?.modelVersion).toContain('all-MiniLM-L6-v2');
      expect(
        await db.caseLink.count({
          where: {
            sourceComplaintId: id('cmp-001'),
            targetComplaintId: id('cmp-003'),
          },
        }),
      ).toBe(0);
    },
    60000,
  );
  it('redacts private relationship data, enforces review roles and rejects stale decisions', async () => {
    const link = await db.caseLink.upsert({
      where: {
        sourceComplaintId_targetComplaintId: {
          sourceComplaintId: id('cmp-001'),
          targetComplaintId: id('cmp-002'),
        },
      },
      create: {
        sourceComplaintId: id('cmp-001'),
        targetComplaintId: id('cmp-002'),
        explanation: { reasons: ['PRIVATE TEST TEXT'], institutionMatch: true },
      },
      update: {},
    });
    const list = await get(`/api/intelligence/links/${id('cmp-001')}`, pgHead);
    expect(list.status).toBe(200);
    expect(list.body.data.items[0].otherComplaint.id).toBeNull();
    expect(JSON.stringify(list.body)).not.toContain('PRIVATE TEST TEXT');
    const body = {
      status: 'CONFIRMED',
      reason: 'Reviewed authorized relationship evidence',
      expectedUpdatedAt: link.updatedAt.toISOString(),
    };
    expect(
      (await post(`/api/intelligence/links/${link.id}/review`, pgOfficer, body))
        .status,
    ).toBe(403);
    expect(
      (await post(`/api/intelligence/links/${link.id}/review`, outsider, body))
        .status,
    ).toBe(404);
    expect(
      (await post(`/api/intelligence/links/${link.id}/review`, pgHead, body))
        .status,
    ).toBe(200);
    expect(
      (await post(`/api/intelligence/links/${link.id}/review`, pgHead, body))
        .status,
    ).toBe(409);
    const complaint = await db.complaint.findUniqueOrThrow({
      where: { id: id('cmp-001') },
    });
    expect(complaint.bureauId).toBe(pgHead.bureauId);
    expect(complaint.originalId).toBe('PGRC-DEMO-001');
    expect(complaint.status).toBe('RECEIVED');
    expect(
      await db.auditLog.count({
        where: { actorId: pgHead.id, event: 'CASE_LINK_REVIEWED' },
      }),
    ).toBe(1);
  });
  it.skipIf(process.env.CASEBRIDGE_TEST_AI !== '1')(
    'never resurrects a human rejection during re-analysis',
    async () => {
      const link = await db.caseLink.findFirstOrThrow({
        where: {
          sourceComplaintId: id('cmp-001'),
          targetComplaintId: id('cmp-002'),
        },
      });
      expect(
        (
          await post(`/api/intelligence/links/${link.id}/review`, pgHead, {
            status: 'REJECTED',
            reason: 'Distinct evidence confirmed by officer',
            expectedUpdatedAt: link.updatedAt.toISOString(),
          })
        ).status,
      ).toBe(200);
      expect(
        (
          await post(
            `/api/intelligence/analyze/${id('cmp-001')}`,
            pgOfficer,
            {},
          )
        ).status,
      ).toBe(200);
      expect(
        (await db.caseLink.findUniqueOrThrow({ where: { id: link.id } }))
          .status,
      ).toBe('REJECTED');
    },
    60000,
  );
  it('records coordination only for authorized confirmed links, with an attributable audit', async () => {
    let link = await db.caseLink.findFirstOrThrow({
      where: {
        sourceComplaintId: id('cmp-001'),
        targetComplaintId: id('cmp-002'),
      },
    });
    if (link.status !== 'CONFIRMED') {
      expect(
        (
          await post('/api/coordination', pgHead, {
            caseLinkId: link.id,
            type: 'SHARE_EVIDENCE',
            rationale: 'Reuse authorized ledger evidence',
          })
        ).status,
      ).toBe(409);
      await post(`/api/intelligence/links/${link.id}/review`, pgHead, {
        status: 'CONFIRMED',
        reason: 'Officer reconsidered the permitted evidence',
        expectedUpdatedAt: link.updatedAt.toISOString(),
      });
      link = await db.caseLink.findUniqueOrThrow({ where: { id: link.id } });
    }
    const body = {
      caseLinkId: link.id,
      type: 'SHARE_EVIDENCE',
      rationale: 'Reuse authorized ledger evidence',
    };
    expect((await post('/api/coordination', pgOfficer, body)).status).toBe(403);
    expect((await post('/api/coordination', outsider, body)).status).toBe(404);
    const response = await post('/api/coordination', pgHead, body);
    expect(response.status, JSON.stringify(response.body)).toBe(201);
    expect(response.body.data.decidedById).toBe(pgHead.id);
    expect(
      await db.auditLog.count({
        where: { actorId: pgHead.id, event: 'COORDINATION_RECORDED' },
      }),
    ).toBe(1);
    expect(
      (
        await post('/api/coordination', pgHead, {
          ...body,
          coordinatorId: pgOfficer.id,
        })
      ).status,
    ).toBe(400);
  });
  it('serializes simultaneous cross-bureau action submissions in real PostgreSQL', async () => {
    const evidenceScope = `fee-ledger:${prefix}`;
    const base = {
      type: 'EVIDENCE_REQUEST',
      summary: 'Request fee ledger',
      evidenceScope,
    };
    const results = await Promise.all([
      post('/api/actions', pgHead, { ...base, complaintId: id('cmp-007') }),
      post('/api/actions', rbHead, { ...base, complaintId: id('cmp-006') }),
    ]);
    expect(
      results.map((r) => r.status).sort(),
      JSON.stringify(results.map((r) => r.body)),
    ).toEqual([201, 409]);
    expect(
      await db.investigationAction.count({ where: { evidenceScope } }),
    ).toBe(1);
    const blocked = results.find((r) => r.status === 409)!;
    expect(blocked.body.error.code).toBe('REVIEW_REQUIRED');
    expect(blocked.body.error.details.warnings[0].relatedActionId).toBeNull();
    expect(
      await db.auditLog.count({
        where: {
          actorId: { in: [pgHead.id, rbHead.id] },
          event: 'ACTION_REVIEW_REQUIRED',
        },
      }),
    ).toBe(1);
  });
  it('rechecks stale previews and persists a reasoned override plus audit', async () => {
    const evidenceScope = `admission-records:${prefix}`;
    const proposal = {
      complaintId: id('cmp-001'),
      type: 'EVIDENCE_REQUEST',
      summary: 'Request admission records',
      evidenceScope,
    };
    const preview = await post('/api/actions/preview', pgOfficer, proposal);
    expect(preview.status).toBe(200);
    expect(preview.body.data.warnings).toHaveLength(0);
    expect(
      (
        await post('/api/actions', rbHead, {
          ...proposal,
          complaintId: id('cmp-002'),
        })
      ).status,
    ).toBe(201);
    expect((await post('/api/actions', pgOfficer, proposal)).status).toBe(409);
    const response = await post('/api/actions', pgOfficer, {
      ...proposal,
      overrideReason:
        'Officer confirmed a separate legally required follow-up.',
    });
    expect(response.status).toBe(201);
    const audit = await db.auditLog.findFirstOrThrow({
      where: { actorId: pgOfficer.id, event: 'ACTION_OVERRIDE_CREATED' },
    });
    expect(audit.metadata).toMatchObject({
      actionId: response.body.data.id,
      overrideReason:
        'Officer confirmed a separate legally required follow-up.',
    });
  });
  it('rolls back real action writes when audit persistence fails', async () => {
    const original = new PrismaFirewallRepository(db);
    const failing: FirewallRepository = {
      complaint: original.complaint.bind(original),
      activeActions: original.activeActions.bind(original),
      create: original.create.bind(original),
      audit: original.audit.bind(original),
      transaction: (institutionId, work) =>
        original.transaction(institutionId, (tx) =>
          work({
            complaint: tx.complaint.bind(tx),
            activeActions: tx.activeActions.bind(tx),
            create: tx.create.bind(tx),
            audit: async () => {
              throw new Error('Simulated audit persistence failure');
            },
          }),
        ),
    };
    const evidenceScope = `unique-rollback:${prefix}`;
    await expect(
      new FirewallService(failing).create(pgOfficer, {
        complaintId: id('cmp-003'),
        type: 'EVIDENCE_REQUEST',
        summary: 'Request roof evidence',
        evidenceScope,
      }),
    ).rejects.toThrow('Simulated audit');
    expect(
      await db.investigationAction.count({ where: { evidenceScope } }),
    ).toBe(0);
  });
  it('returns scoped graph nodes with no dangling or private cross-bureau edges', async () => {
    const scoped = await get(
      `/api/intelligence/graph/${id('inst-01')}`,
      pgHead,
    );
    expect(scoped.status).toBe(200);
    const data = scoped.body.data;
    const nodeIds = new Set(data.nodes.map((n: { id: string }) => n.id));
    expect(
      data.nodes.some(
        (n: { metadata: { recordId: string } }) =>
          n.metadata.recordId === id('cmp-002'),
      ),
    ).toBe(false);
    for (const e of data.edges) {
      expect(nodeIds.has(e.source)).toBe(true);
      expect(nodeIds.has(e.target)).toBe(true);
    }
    const global = await get(`/api/intelligence/graph/${id('inst-01')}`, admin);
    expect(global.status).toBe(200);
    expect(
      global.body.data.edges.some(
        (e: { type: string; metadata: { status: string } }) =>
          e.type === 'RELATED_TO' && e.metadata.status === 'CONFIRMED',
      ),
    ).toBe(true);
  });
});
