/** Real DB only: explicit disposable test URL required. All records are isolated by random prefix. */
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import pg from 'pg';
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
  title: 'Admission fee concern',
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
          data: { id: id(code), code: id(code), name: 'Bureau ' + code },
        });
      for (const name of ['inst', 'other'])
        await db.institution.create({
          data: {
            id: id(name),
            permanentId: id('permanent-' + name),
            name: 'Aaravika Institute of Engineering',
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
            displayName: 'Officer ' + name,
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
        data: {
          id: id('private'),
          ...newCase('private', id('RB')),
          sourceBureauId: id('RB'),
        },
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
      const alerts = await send('get', '/alerts?resolved=all');
      expect(JSON.stringify(alerts.body)).not.toContain('private-action');
      expect(
        alerts.body.data.items.every(
          (a: { bureauId: string }) => a.bureauId === id('PGRC'),
        ),
      ).toBe(true);
    });
    it('aggregates actual scoped records including overdue and escalation counts', async () => {
      const report = await send('get', '/reports/summary');
      expect(report.status, JSON.stringify(report.body)).toBe(200);
      expect(JSON.stringify(report.body)).not.toContain('private-action');
      const ready = await request(app).get('/api/health/ready');
      expect(ready.status).toBe(200);
      expect(ready.body.data.checks).toMatchObject({
        database: true,
        auth: true,
      });
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
    it('lets exactly one concurrent workspace writer win and exposes discoverable, redacted history', async () => {
      const own = await send(
        'get',
        `/coordination/workspaces/${workspaceId}`,
        'head',
      );
      const [complaintId] = own.body.data.complaintIds;
      const writes = await Promise.all(
        (['IN_PROGRESS', 'COMPLETED'] as const).map((status) =>
          send('patch', `/coordination/workspaces/${workspaceId}`, 'head', {
            expectedVersion: own.body.data.version,
            command: { kind: 'SET_STATUS', status },
          }),
        ),
      );
      expect(writes.map((w) => w.status).sort()).toEqual([200, 409]);
      expect(writes.find((w) => w.status === 409)!.body.error.code).toBe(
        'STALE_COORDINATION',
      );
      const byComplaint = await send(
        'get',
        `/coordination/workspaces?complaintId=${complaintId}`,
        'head',
      );
      expect(byComplaint.body.meta.total).toBe(1);
      expect(byComplaint.body.data.items[0].id).toBe(workspaceId);
      const otherStatus =
        writes.find((w) => w.status === 200)!.body.data.status === 'COMPLETED'
          ? 'OPEN'
          : 'COMPLETED';
      expect(
        (
          await send(
            'get',
            `/coordination/workspaces?status=${otherStatus}`,
            'head',
          )
        ).body.meta.total,
      ).toBe(0);
      expect(
        (
          await send(
            'get',
            `/coordination/workspaces?complaintId=${complaintId}`,
            'rb',
          )
        ).status,
      ).toBe(404);
      expect(
        (
          await send(
            'get',
            `/coordination/workspaces?complaintId=${id('private')}`,
            'rb',
          )
        ).body.meta.total,
      ).toBe(1);
      const history = await send(
        'get',
        `/coordination/workspaces/${workspaceId}/history`,
        'head',
      );
      expect(history.status).toBe(200);
      const items = history.body.data.items;
      expect(
        items.map((i: { operation: string | null }) => i.operation),
      ).toEqual([null, 'ASSIGN', 'TRACK_ACTION', 'SET_STATUS']);
      expect(items[1]).toMatchObject({
        fromCoordinatorId: null,
        toCoordinatorId: id('officer'),
        coordinatorRestricted: false,
      });
      expect(items[2].actionId).toBeTruthy();
      const redacted = await send(
        'get',
        `/coordination/workspaces/${workspaceId}/history`,
        'rb',
      );
      expect(redacted.body.data.items[1]).toMatchObject({
        toCoordinatorId: null,
        coordinatorRestricted: true,
        actorId: null,
      });
      expect(redacted.body.data.items[2]).toMatchObject({
        actionId: null,
        actionRestricted: true,
      });
      expect(JSON.stringify(redacted.body)).not.toContain(id('officer'));
      const timeline = await send('get', `/complaints/${complaintId}/timeline`);
      const updates = timeline.body.data.items.filter(
        (e: { event: string }) => e.event === 'COORDINATION_WORKSPACE_UPDATED',
      );
      expect(updates.length).toBeGreaterThan(0);
      expect(Object.keys(updates[0].metadata).sort()).toEqual(
        expect.arrayContaining(['operation', 'version', 'workspaceId']),
      );
      expect(JSON.stringify(updates)).not.toContain('CoordinatorId');
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
    it('re-raises recurring review alerts after automatic resolution but keeps manual resolution', async () => {
      const created = await send(
        'post',
        '/complaints',
        'officer',
        newCase('alerting'),
      );
      const complaintId = created.body.data.id;
      const review = (status: 'PENDING' | 'REVIEWED') =>
        db.complaint.update({
          where: { id: complaintId },
          data: { overlapReviewStatus: status },
        });
      const open = () =>
        db.alert.findMany({
          where: { complaintId, type: 'OVERLAP', resolvedAt: null },
        });
      const refresh = () => send('post', '/alerts/refresh', 'head');
      await review('PENDING');
      const concurrent = await Promise.all([refresh(), refresh()]);
      expect(concurrent.map((r) => r.status)).toEqual([200, 200]);
      const [first] = await open();
      expect(first.dedupeKey).toBe(`review:${complaintId}`);
      expect((await open()).length).toBe(1);
      expect(
        (
          await send('patch', `/alerts/${first.id}`, 'officer', {
            resolved: true,
          })
        ).status,
      ).toBe(200);
      await refresh();
      expect(await open()).toHaveLength(0);
      await review('REVIEWED');
      await refresh();
      expect(
        (await db.alert.findUniqueOrThrow({ where: { id: first.id } }))
          .dedupeKey,
      ).toBe(`review:${complaintId}#closed:${first.id}`);
      await review('PENDING');
      await refresh();
      const reopened = await open();
      expect(reopened).toHaveLength(1);
      expect(reopened[0].id).not.toBe(first.id);
      expect(reopened[0].dedupeKey).toBe(`review:${complaintId}`);
      await review('REVIEWED');
      await refresh();
      expect(await open()).toHaveLength(0);
    });
    it('rejects transfers into a bureau that already holds the reference without changing the case', async () => {
      const created = await send(
        'post',
        '/complaints',
        'officer',
        newCase('dup-ref'),
      );
      await db.complaint.create({
        data: {
          id: id('rb-dup'),
          ...newCase('dup-ref', id('RB')),
          sourceBureauId: id('RB'),
        },
      });
      const transfer = await send(
        'patch',
        `/complaints/${created.body.data.id}`,
        'admin',
        { expectedVersion: 0, reason: 'Transfer', bureauId: id('RB') },
      );
      expect(transfer.status).toBe(409);
      expect(transfer.body.error.code).toBe('DUPLICATE_REFERENCE');
      const unchanged = await db.complaint.findUniqueOrThrow({
        where: { id: created.body.data.id },
      });
      expect(unchanged).toMatchObject({ bureauId: id('PGRC'), version: 0 });
    });
    it('returns a retryable 503 when another transaction holds the institution lock', async () => {
      const holder = new pg.Client({
        connectionString: process.env.CASEBRIDGE_TEST_DATABASE_URL,
      });
      await holder.connect();
      try {
        await holder.query(`SELECT pg_advisory_lock(hashtextextended($1, 0))`, [
          `setu:institution:${id('inst')}`,
        ]);
        const blocked = await send(
          'post',
          '/complaints',
          'officer',
          newCase('locked'),
        );
        expect(blocked.status).toBe(503);
        expect(blocked.body.error.code).toBe('DEPENDENCY_UNAVAILABLE');
      } finally {
        await holder.end();
      }
      expect(
        (await send('post', '/complaints', 'officer', newCase('locked')))
          .status,
      ).toBe(201);
    }, 20000);
    it('applies inclusive UTC date bounds and measured resolution durations in scoped reports', async () => {
      const at = (iso: string) => new Date(iso);
      for (const [name, createdAt, resolvedAt] of [
        ['jan-start', '2001-01-01T00:00:00.000Z', '2001-01-02T12:00:00.000Z'],
        ['jan-end', '2001-01-31T23:59:59.999Z', null],
        ['feb', '2001-02-01T00:00:00.000Z', '2001-02-01T01:00:00.000Z'],
      ] as const)
        await db.complaint.create({
          data: {
            id: id(name),
            ...newCase(name),
            sourceBureauId: id('PGRC'),
            createdAt: at(createdAt),
            status: resolvedAt ? 'DISPOSED' : 'RECEIVED',
            resolvedAt: resolvedAt ? at(resolvedAt) : null,
          },
        });
      const range =
        '?from=2001-01-01T00:00:00.000Z&to=2001-01-31T23:59:59.999Z';
      const report = await send('get', `/reports/summary${range}`, 'head');
      expect(report.status).toBe(200);
      expect(report.body.data).toMatchObject({
        totalComplaints: 2,
        disposedComplaints: 1,
        pendingComplaints: 1,
        averageResolutionHours: 36,
        trends: [{ month: '2001-01', count: 2 }],
      });
      const other = await send('get', `/dashboard/summary${range}`, 'rb');
      expect(other.body.data.totalComplaints).toBe(0);
      const all = await send(
        'get',
        '/reports/summary?from=2001-01-01T00:00:00.000Z&to=2001-12-31T23:59:59.999Z',
        'admin',
      );
      expect(all.body.data.averageResolutionHours).toBe(18.5);
    });
    it('rejects an expired persisted session while other sessions stay valid', async () => {
      const login = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://localhost:5173')
        .send({ email: `${id('head')}@example.invalid`, password });
      const fresh = login.headers['set-cookie'][0].split(';')[0];
      const session = await db.authSession.findFirstOrThrow({
        where: { userId: id('head') },
        orderBy: { createdAt: 'desc' },
      });
      await db.authSession.update({
        where: { id: session.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      expect(
        (await request(app).get('/api/auth/me').set('Cookie', fresh)).status,
      ).toBe(401);
      expect((await send('get', '/auth/me', 'head')).status).toBe(200);
    });
    it('revokes sessions on logout and rejects copied expired/revoked cookies', async () => {
      expect((await send('post', '/auth/logout')).status).toBe(200);
      expect((await send('get', '/auth/me')).status).toBe(401);
    });
  },
);
