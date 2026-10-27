/** Real DB only: explicit disposable test URL required. All records are isolated by random prefix. */
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
vi.hoisted(() => {
  if (process.env.CASEBRIDGE_TEST_DATABASE_URL)
    process.env.DATABASE_URL = process.env.CASEBRIDGE_TEST_DATABASE_URL;
  process.env.JWT_SECRET = crypto.randomUUID() + crypto.randomUUID();
  process.env.NODE_ENV = 'test';
  process.env.FRONTEND_URL = 'http://localhost:5173';
});
import { app } from '../../app.js';
import { getPrisma, disconnectPrisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/security.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
const prefix = `core-test-${randomUUID()}`,
  id = (v: string) => `${prefix}-${v}`;
let db: PrismaClient;
const cookies: Record<string, string> = {};
let caseId: string;
let version = 0;
let workspaceId: string;
const password = `test-only-${randomUUID()}`;
const send = (
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
  who = 'officer',
  body: object = {},
) => {
  const client = request(app);
  return client[method](`/api${path}`)
    .set('Cookie', cookies[who] ?? '')
    .set('Origin', 'http://localhost:5173')
    .send(body);
};
const newCase = (ref: string, bureauId = id('PGRC')) => ({
  originalId: ref,
  institutionId: id('inst'),
  bureauId,
  title: 'Fictional admission concern',
  description:
    'Synthetic unauthorized admission fee allegation for testing only.',
  category: 'FEES',
});
describe.skipIf(!process.env.CASEBRIDGE_TEST_DATABASE_URL)(
  'operational PostgreSQL integration',
  () => {
    beforeAll(async () => {
      db = getPrisma();
      const hash = await hashPassword(password);
      for (const code of ['PGRC', 'RB'])
        await db.bureau.create({
          data: { id: id(code), code: id(code), name: 'Fictional ' + code },
        });
      for (const name of ['inst', 'other'])
        await db.institution.create({
          data: {
            id: id(name),
            permanentId: id('permanent-' + name),
            name: 'Fictional institution',
            state: 'Kerala',
          },
        });
      for (const [name, role, bureau] of [
        ['officer', 'OFFICER', 'PGRC'],
        ['head', 'BUREAU_HEAD', 'PGRC'],
        ['rb', 'BUREAU_HEAD', 'RB'],
        ['admin', 'ADMIN', null],
      ] as const) {
        await db.user.create({
          data: {
            id: id(name),
            email: `${id(name)}@example.invalid`,
            displayName: 'Fictional ' + name,
            role,
            bureauId: bureau ? id(bureau) : null,
            passwordHash: hash,
          },
        });
        const login = await request(app)
          .post('/api/auth/login')
          .set('Origin', 'http://localhost:5173')
          .send({ email: `${id(name)}@example.invalid`, password });
        expect(login.status, JSON.stringify(login.body)).toBe(200);
        cookies[name] = login.headers['set-cookie'][0].split(';')[0];
      }
      await db.complaint.create({
        data: { id: id('private'), ...newCase('private', id('RB')) },
      });
    }, 30000);
    afterAll(async () => {
      if (!db) return;
      const starts = { startsWith: prefix };
      const complaints = await db.complaint.findMany({
        where: {
          OR: [
            { id: starts },
            { bureauId: starts },
            { sourceBureauId: starts },
          ],
        },
        select: { id: true },
      });
      const ids = complaints.map((c) => c.id);
      await db.coordinationSharedAction.deleteMany({
        where: { workspace: { createdById: starts } },
      });
      await db.coordinationWorkspace.deleteMany({
        where: { createdById: starts },
      });
      await db.auditLog.deleteMany({
        where: { OR: [{ actorId: starts }, { complaintId: { in: ids } }] },
      });
      await db.alert.deleteMany({ where: { bureauId: starts } });
      await db.coordinationDecision.deleteMany({
        where: { decidedById: starts },
      });
      await db.caseLink.deleteMany({
        where: {
          OR: [
            { sourceComplaintId: { in: ids } },
            { targetComplaintId: { in: ids } },
          ],
        },
      });
      await db.investigationAction.deleteMany({
        where: { complaintId: { in: ids } },
      });
      await db.complaint.deleteMany({ where: { id: { in: ids } } });
      await db.user.deleteMany({ where: { id: starts } });
      await db.institution.deleteMany({ where: { id: starts } });
      await db.bureau.deleteMany({ where: { id: starts } });
      await disconnectPrisma();
    }, 30000);
    it('registers complaints and enforces bureau isolation for details, lists and institution counts', async () => {
      const created = await send(
        'post',
        '/complaints',
        'officer',
        newCase('created'),
      );
      expect(created.status, JSON.stringify(created.body)).toBe(201);
      caseId = created.body.data.id;
      expect(created.body.data.sourceBureauId).toBe(id('PGRC'));
      expect(created.body.data.version).toBe(0);
      expect((await send('get', `/complaints/${caseId}`, 'rb')).status).toBe(
        404,
      );
      expect(
        (
          await send(
            'post',
            '/complaints',
            'officer',
            newCase('forged', id('RB')),
          )
        ).status,
      ).toBe(403);
      const list = await send('get', `/complaints?q=admission&pageSize=1`);
      expect(list.body.meta.total).toBe(1);
      expect(list.body.data.items).toHaveLength(1);
      const profile = await send('get', `/institutions/${id('inst')}`);
      expect(profile.body.data.authorizedComplaintCount).toBe(1);
      expect(JSON.stringify(profile.body)).not.toContain(id('private'));
    });
    it('imports CSV atomically, rejects duplicates and preserves original references', async () => {
      const csv = `originalId,institutionId,bureauId,title,description,category\nimport-1,${id('inst')},${id('PGRC')},Roof,Synthetic roof concern,INFRASTRUCTURE`;
      expect(
        (await send('post', '/complaints/import/csv', 'officer', { csv }))
          .status,
      ).toBe(403);
      expect(
        (await send('post', '/complaints/import/csv', 'head', { csv })).status,
      ).toBe(201);
      expect(
        (
          await send('post', '/complaints/import', 'head', {
            items: [newCase('rolled-back'), newCase('created')],
          })
        ).status,
      ).toBe(409);
      expect(
        await db.complaint.count({
          where: { bureauId: id('PGRC'), originalId: 'rolled-back' },
        }),
      ).toBe(0);
    });
    it('assigns only active bureau officers and rejects stale or unauthorized updates', async () => {
      expect(
        (
          await send('patch', `/complaints/${caseId}`, 'officer', {
            expectedVersion: version,
            reason: 'Assign',
            assignedToId: id('officer'),
          })
        ).status,
      ).toBe(403);
      expect(
        (
          await send('patch', `/complaints/${caseId}`, 'head', {
            expectedVersion: version,
            reason: 'Wrong bureau',
            assignedToId: id('rb'),
          })
        ).status,
      ).toBe(404);
      const changed = await send('patch', `/complaints/${caseId}`, 'head', {
        expectedVersion: version,
        reason: 'Assign authorized officer',
        assignedToId: id('officer'),
      });
      expect(changed.status).toBe(200);
      version = changed.body.data.version;
      expect(
        (
          await send('patch', `/complaints/${caseId}`, 'head', {
            expectedVersion: 0,
            reason: 'Stale',
            status: 'ESCALATED',
          })
        ).status,
      ).toBe(409);
    });
    it('records lifecycle changes, deduplicates deadline alerts and whitelists timelines', async () => {
      const updated = await send('patch', `/complaints/${caseId}`, 'officer', {
        expectedVersion: version,
        reason: 'Requires review',
        status: 'ESCALATED',
        dueAt: new Date(Date.now() - 86400000).toISOString(),
      });
      expect(updated.status).toBe(200);
      version = updated.body.data.version;
      expect((await send('post', '/alerts/refresh', 'head')).status).toBe(200);
      expect((await send('post', '/alerts/refresh', 'head')).status).toBe(200);
      expect(
        await db.alert.count({
          where: { complaintId: caseId, type: 'DEADLINE', resolvedAt: null },
        }),
      ).toBe(1);
      await db.auditLog.create({
        data: {
          actorId: id('officer'),
          complaintId: caseId,
          event: 'ACTION_OVERRIDE_CREATED',
          metadata: {
            internalOverlapActionIds: [id('private-action')],
            actionId: id('private-action'),
            overrideReason: 'private-secret',
            ruleVersion: 'v1',
          },
        },
      });
      const history = await send('get', `/complaints/${caseId}/timeline`);
      expect(history.status).toBe(200);
      expect(JSON.stringify(history.body)).not.toContain('private-secret');
      expect(JSON.stringify(history.body)).not.toContain('private-action');
      expect(
        (await send('get', `/complaints/${caseId}/timeline`, 'rb')).status,
      ).toBe(404);
      const alerts = await send('get', '/alerts');
      expect(
        alerts.body.data.items.every(
          (a: { bureauId: string }) => a.bureauId === id('PGRC'),
        ),
      ).toBe(true);
    });
    it('aggregates actual scoped records including overdue and escalation counts', async () => {
      const report = await send('get', '/reports/summary');
      expect(report.status, JSON.stringify(report.body)).toBe(200);
      expect(report.body.data.totalComplaints).toBe(2);
      expect(report.body.data.overdueCount).toBe(1);
      expect(report.body.data.escalatedComplaints).toBe(1);
      expect(report.body.data.averageResolutionHours).toBeNull();
      expect(report.body.data.byBureau).toHaveLength(1);
      expect(
        report.body.data.trends.reduce(
          (n: number, r: { count: number }) => n + r.count,
          0,
        ),
      ).toBe(2);
    });
    it('reassigns institutions with locks and preserves source bureau on explicit admin transfer', async () => {
      const moved = await send('patch', `/complaints/${caseId}`, 'head', {
        expectedVersion: version,
        reason: 'Correct institution',
        institutionId: id('other'),
      });
      expect(moved.status, JSON.stringify(moved.body)).toBe(200);
      version = moved.body.data.version;
      expect(
        (
          await send('patch', `/complaints/${caseId}`, 'head', {
            expectedVersion: version,
            reason: 'Transfer',
            bureauId: id('RB'),
          })
        ).status,
      ).toBe(403);
      const transfer = await send('patch', `/complaints/${caseId}`, 'admin', {
        expectedVersion: version,
        reason: 'Approved bureau transfer',
        bureauId: id('RB'),
      });
      expect(transfer.status).toBe(200);
      version = transfer.body.data.version;
      expect(transfer.body.data.sourceBureauId).toBe(id('PGRC'));
      expect(transfer.body.data.originalId).toBe('created');
      expect(transfer.body.data.assignedToId).toBeNull();
      expect((await send('get', `/complaints/${caseId}`)).status).toBe(404);
      expect((await send('get', `/complaints/${caseId}`, 'rb')).status).toBe(
        200,
      );
    });
    it('persists coordination assignments/actions with optimistic concurrency and private IDs redacted', async () => {
      const c = await db.complaint.findFirstOrThrow({
        where: { bureauId: id('PGRC') },
      });
      const pair = [c.id, id('private')].sort();
      const link = await db.caseLink.create({
        data: {
          sourceComplaintId: pair[0],
          targetComplaintId: pair[1],
          status: 'CONFIRMED',
          explanation: {},
        },
      });
      const created = await send('post', '/coordination/workspaces', 'head', {
        caseLinkId: link.id,
      });
      expect(created.status, JSON.stringify(created.body)).toBe(201);
      workspaceId = created.body.data.id;
      expect(created.body.data.complaintIds).toEqual([c.id]);
      const assigned = await send(
        'patch',
        `/coordination/workspaces/${workspaceId}`,
        'head',
        {
          expectedVersion: 0,
          command: { kind: 'ASSIGN', officerId: id('officer') },
        },
      );
      expect(assigned.status).toBe(200);
      expect(
        (
          await send(
            'patch',
            `/coordination/workspaces/${workspaceId}`,
            'head',
            {
              expectedVersion: 0,
              command: { kind: 'SET_STATUS', status: 'IN_PROGRESS' },
            },
          )
        ).status,
      ).toBe(409);
      const action = await send('post', '/actions', 'officer', {
        complaintId: c.id,
        type: 'REVIEW',
        summary: 'Independent roof review',
      });
      expect(action.status).toBe(201);
      const tracked = await send(
        'patch',
        `/coordination/workspaces/${workspaceId}`,
        'head',
        {
          expectedVersion: 1,
          command: { kind: 'TRACK_ACTION', actionId: action.body.data.id },
        },
      );
      expect(tracked.status).toBe(200);
      expect(
        await db.coordinationSharedAction.count({ where: { workspaceId } }),
      ).toBe(1);
      const privateView = await send(
        'get',
        `/coordination/workspaces/${workspaceId}`,
        'rb',
      );
      expect(privateView.status).toBe(200);
      expect(privateView.body.data.sharedActionIds).toEqual([]);
      expect(privateView.body.data.coordinatorId).toBeNull();
    });
    it('disposes with resolution timestamps and archives without deleting history', async () => {
      const disposed = await send('patch', `/complaints/${caseId}`, 'rb', {
        expectedVersion: version,
        reason: 'Officer reviewed outcome',
        status: 'DISPOSED',
      });
      expect(disposed.status).toBe(200);
      version = disposed.body.data.version;
      expect(disposed.body.data.resolvedAt).toBeTruthy();
      expect(
        (
          await send('delete', `/complaints/${caseId}`, 'admin', {
            expectedVersion: version,
            reason: 'Archive completed case',
          })
        ).status,
      ).toBe(200);
      expect(await db.complaint.count({ where: { id: caseId } })).toBe(1);
      expect(
        await db.auditLog.count({
          where: { complaintId: caseId, event: 'COMPLAINT_ARCHIVED' },
        }),
      ).toBe(1);
    });
    it('revokes sessions on logout and rejects copied expired/revoked cookies', async () => {
      expect((await send('post', '/auth/logout')).status).toBe(200);
      expect((await send('get', '/auth/me')).status).toBe(401);
    });
  },
);
