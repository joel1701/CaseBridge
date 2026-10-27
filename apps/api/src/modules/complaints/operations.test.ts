import { describe, it, expect, vi } from 'vitest';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { parseCsv, listSchema, changeSchema } from './validation.js';
import {
  complaintFilter,
  checkTransition,
  ComplaintService,
} from './service.js';
import { safeMetadata } from '../case-history/service.js';
import { desiredAlerts, alertScope } from '../alerts/service.js';
import { withInstitutions } from './transaction.js';
const officer = { id: 'officer', role: 'OFFICER' as const, bureauId: 'PGRC' };
const head = { ...officer, role: 'BUREAU_HEAD' as const };
const admin = { id: 'admin', role: 'ADMIN' as const, bureauId: null };
describe('operational validation and privacy', () => {
  it('imports quoted CSV and rejects unknown, duplicate and missing columns', () => {
    const rows = parseCsv({
      csv: 'originalId,institutionId,bureauId,title,description,category\nref,inst,PGRC,"Fee, issue","Quoted ""text""",FEES',
    });
    expect(rows[0].title).toBe('Fee, issue');
    expect(rows[0].description).toBe('Quoted "text"');
    for (const csv of [
      'id,title\na,b',
      'originalId,originalId\na,b',
      'originalId,institutionId,bureauId,title,description,category\na,b,c,d,e,f,extra',
    ])
      expect(() => parseCsv({ csv })).toThrow();
  });
  it('scopes every search and refuses bureau widening and invalid pagination', () => {
    const q = listSchema.parse({ q: 'fee', page: '2', pageSize: '10' });
    expect(complaintFilter(officer, q)).toMatchObject({
      bureauId: 'PGRC',
      archivedAt: null,
    });
    expect(() =>
      complaintFilter(officer, listSchema.parse({ bureauId: 'RB' })),
    ).toThrow();
    expect(listSchema.safeParse({ pageSize: 10000 }).success).toBe(false);
    expect(
      changeSchema.safeParse({
        expectedVersion: 0,
        reason: 'test',
        createdById: 'forged',
      }).success,
    ).toBe(false);
  });
  it('enforces lifecycle transitions instead of accepting arbitrary states', () => {
    expect(() => checkTransition('RECEIVED', 'UNDER_PROCESS')).not.toThrow();
    expect(() => checkTransition('DISPOSED', 'RECEIVED')).toThrow();
    expect(() => checkTransition('RECEIVED', 'TRANSFERRED')).toThrow();
  });
  it('never serializes private audit identifiers or unrecognized metadata', () => {
    const raw = {
      internalOverlapActionIds: ['secret-action'],
      actionId: 'secret',
      complaintId: 'private',
      overrideReason: 'private reason',
      ruleVersion: 'v1',
      warningCodes: ['POSSIBLE_DUPLICATE'],
    };
    expect(safeMetadata('ACTION_OVERRIDE_CREATED', raw)).toEqual({
      ruleVersion: 'v1',
      warningCodes: ['POSSIBLE_DUPLICATE'],
    });
    expect(safeMetadata('UNKNOWN', raw)).toEqual({});
    expect(
      JSON.stringify(
        safeMetadata('CASE_LINK_REVIEWED', {
          status: 'CONFIRMED',
          reason: 'private',
          linkId: 'secret',
        }),
      ),
    ).not.toContain('private');
  });
  it('derives deterministic alert keys and resolves disposed cases', () => {
    const now = new Date('2026-10-27T00:00:00Z');
    const c = {
      id: 'c',
      status: 'ESCALATED',
      archivedAt: null,
      dueAt: new Date('2026-10-26T00:00:00Z'),
      overlapReviewStatus: 'PENDING',
    };
    expect(desiredAlerts(c, now, 48)).toEqual(desiredAlerts(c, now, 48));
    expect(desiredAlerts(c, now, 48)).toHaveLength(2);
    expect(desiredAlerts({ ...c, status: 'DISPOSED' }, now, 48)).toEqual([]);
    expect(alertScope(officer)).toMatchObject({
      bureauId: 'PGRC',
      OR: [{ complaintId: null }, { complaint: { bureauId: 'PGRC' } }],
    });
  });
  it('takes both institution locks once in deterministic order', async () => {
    const locks: string[] = [];
    const db = {
      $transaction: async (work: (tx: unknown) => Promise<unknown>) =>
        work({
          $executeRaw: async () => 0,
          $queryRaw: async (_s: unknown, key: string) => {
            locks.push(key);
            return [];
          },
        }),
    };
    await withInstitutions(
      db as unknown as PrismaClient,
      ['z', 'a', 'z'],
      async () => true,
    );
    expect(locks).toEqual([
      'casebridge:institution:a',
      'casebridge:institution:z',
    ]);
  });
});
function fakeDb(overrides: Record<string, unknown> = {}) {
  const record = {
    id: 'c',
    bureauId: 'PGRC',
    institutionId: 'i',
    version: 0,
    status: 'RECEIVED',
    archivedAt: null,
    sourceBureauId: 'PGRC',
    resolvedAt: null,
  };
  const tx = {
    complaint: {
      findFirst: vi.fn(async () => record),
      updateMany: vi.fn(async () => ({ count: 1 })),
      findUniqueOrThrow: vi.fn(async () => ({ ...record, version: 1 })),
    },
    user: { findFirst: vi.fn(async () => null) },
    bureau: { findUnique: vi.fn(async () => ({ id: 'RB' })) },
    institution: { findUnique: vi.fn(async () => ({ id: 'j' })) },
    caseLink: { count: vi.fn(async () => 0) },
    coordinationWorkspace: { count: vi.fn(async () => 0) },
    auditLog: { create: vi.fn(async () => ({})) },
    alert: {
      create: vi.fn(async () => ({})),
      updateMany: vi.fn(async () => ({ count: 0 })),
    },
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
    ...overrides,
  };
  const db = {
    ...tx,
    $transaction: async (work: (tx: unknown) => Promise<unknown>) => work(tx),
  };
  return { db: db as unknown as PrismaClient, tx };
}
it('rejects stale versions before updating and audits status changes', async () => {
  const { db, tx } = fakeDb();
  const service = new ComplaintService(db);
  await expect(
    service.update(officer, 'c', {
      expectedVersion: 5,
      reason: 'test',
      status: 'UNDER_PROCESS',
    }),
  ).rejects.toMatchObject({ code: 'STALE_COMPLAINT' });
  expect(tx.complaint.updateMany).not.toHaveBeenCalled();
  await service.update(officer, 'c', {
    expectedVersion: 0,
    reason: 'start investigation',
    status: 'UNDER_PROCESS',
  });
  expect(tx.auditLog.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        actorId: 'officer',
        event: 'COMPLAINT_STATUS_CHANGED',
      }),
    }),
  );
});
it('requires authorized assignments and administrator transfers', async () => {
  const { db, tx } = fakeDb();
  const service = new ComplaintService(db);
  await expect(
    service.update(officer, 'c', {
      expectedVersion: 0,
      reason: 'assign',
      assignedToId: 'other',
    }),
  ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await expect(
    service.update(head, 'c', {
      expectedVersion: 0,
      reason: 'assign',
      assignedToId: 'other',
    }),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  await expect(
    service.update(head, 'c', {
      expectedVersion: 0,
      reason: 'transfer',
      bureauId: 'RB',
    }),
  ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await service.update(admin, 'c', {
    expectedVersion: 0,
    reason: 'transfer authorized',
    bureauId: 'RB',
  });
  expect(tx.complaint.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        bureauId: 'RB',
        sourceBureauId: 'PGRC',
        status: 'TRANSFERRED',
        assignedToId: null,
      }),
    }),
  );
});
it('refuses institution moves that would invalidate reviewed relationships', async () => {
  const { db } = fakeDb({ caseLink: { count: async () => 1 } });
  await expect(
    new ComplaintService(db).update(head, 'c', {
      expectedVersion: 0,
      reason: 'correction',
      institutionId: 'j',
    }),
  ).rejects.toMatchObject({ code: 'RELATIONSHIP_DEPENDENCY' });
});
