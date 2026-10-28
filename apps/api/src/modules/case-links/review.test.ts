import { it, expect, vi } from 'vitest';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { CaseLinkService } from './service.js';
import { CoordinationService } from '../coordination/service.js';
function database(status = 'SUGGESTED') {
  const source = {
    id: 'a',
    institutionId: 'i',
    bureauId: 'PGRC',
    bureau: { code: 'PGRC' },
  };
  const target = {
    id: 'b',
    institutionId: 'i',
    bureauId: 'RB',
    bureau: { code: 'RB' },
  };
  const link = {
    id: 'l',
    sourceComplaintId: 'a',
    targetComplaintId: 'b',
    sourceComplaint: source,
    targetComplaint: target,
    status,
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(0),
    $queryRaw: vi.fn().mockResolvedValue([]),
    caseLink: {
      findFirst: vi.fn().mockResolvedValue(link),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      count: vi.fn().mockResolvedValue(0),
    },
    complaint: { update: vi.fn().mockResolvedValue({}) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    coordinationDecision: {
      create: vi
        .fn()
        .mockImplementation(({ data }) =>
          Promise.resolve({ id: 'd', ...data, createdAt: new Date() }),
        ),
    },
  };
  const db = {
    ...tx,
    $transaction: async (work: (value: typeof tx) => unknown) => work(tx),
  } as unknown as PrismaClient;
  return { db, tx, link };
}
const head = { id: 'head', role: 'BUREAU_HEAD' as const, bureauId: 'PGRC' };
it('persists reviewer identity/reason, recomputes review state and audits in one transaction', async () => {
  const { db, tx, link } = database();
  const result = await new CaseLinkService(db).review(head, 'l', {
    status: 'CONFIRMED',
    reason: 'Permitted evidence reviewed',
    expectedUpdatedAt: link.updatedAt.toISOString(),
  });
  expect(result.reviewedById).toBe('head');
  expect(tx.complaint.update).toHaveBeenCalledTimes(2);
  expect(tx.auditLog.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        actorId: 'head',
        event: 'CASE_LINK_REVIEWED',
      }),
    }),
  );
  expect(result.updatedAt.getTime()).toBeGreaterThan(link.updatedAt.getTime());
});
it('rejects a concurrent stale review before writing history', async () => {
  const { db, tx, link } = database();
  tx.caseLink.updateMany.mockResolvedValue({ count: 0 });
  await expect(
    new CaseLinkService(db).review(head, 'l', {
      status: 'REJECTED',
      reason: 'Different matter',
      expectedUpdatedAt: link.updatedAt.toISOString(),
    }),
  ).rejects.toMatchObject({ code: 'STALE_REVIEW' });
  expect(tx.auditLog.create).not.toHaveBeenCalled();
});
it('requires confirmed links for shared work, and records actor-attributed decisions', async () => {
  const pending = database();
  await expect(
    new CoordinationService(pending.db).record(head, {
      caseLinkId: 'l',
      type: 'JOINT_INVESTIGATION',
      rationale: 'Coordinate',
    }),
  ).rejects.toMatchObject({ code: 'INVALID_STATE' });
  expect(pending.tx.coordinationDecision.create).not.toHaveBeenCalled();
  const confirmed = database('CONFIRMED');
  const decision = await new CoordinationService(confirmed.db).record(head, {
    caseLinkId: 'l',
    type: 'SHARE_EVIDENCE',
    rationale: 'Share permitted evidence',
  });
  expect(decision.decidedById).toBe('head');
  expect(confirmed.tx.auditLog.create).toHaveBeenCalledOnce();
});
