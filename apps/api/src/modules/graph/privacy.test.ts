import { it, expect, vi } from 'vitest';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { GraphService } from './service.js';
it('scopes every graph entity lookup and returns no private counterpart', async () => {
  const principal = { id: 'u', role: 'OFFICER' as const, bureauId: 'PGRC' };
  const own = {
    id: 'c1',
    originalId: 'PGRC-1',
    bureauId: 'PGRC',
    category: 'FEES',
    status: 'RECEIVED',
    overlapReviewStatus: 'PENDING',
    bureau: { id: 'PGRC', code: 'PGRC', name: 'Grievance bureau' },
  };
  const tx = {
    institution: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'i',
        name: 'Aaravika Institute of Engineering',
        permanentId: 'SYN-1',
        state: 'Kerala',
      }),
    },
    complaint: { findMany: vi.fn().mockResolvedValue([own]) },
    investigationAction: { findMany: vi.fn().mockResolvedValue([]) },
    caseLink: { findMany: vi.fn().mockResolvedValue([]) },
  };
  const db = {
    $transaction: async (work: (value: typeof tx) => unknown) => work(tx),
  } as unknown as PrismaClient;
  const graph = await new GraphService(db).get(principal, 'i');
  expect(tx.complaint.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { institutionId: 'i', bureauId: 'PGRC' },
    }),
  );
  expect(tx.investigationAction.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { complaintId: { in: ['c1'] }, bureauId: 'PGRC' },
    }),
  );
  expect(tx.caseLink.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        sourceComplaintId: { in: ['c1'] },
        targetComplaintId: { in: ['c1'] },
      }),
    }),
  );
  const ids = new Set(graph.nodes.map((n) => n.id));
  for (const edge of graph.edges) {
    expect(ids.has(edge.source)).toBe(true);
    expect(ids.has(edge.target)).toBe(true);
  }
  expect(graph.nodes.filter((n) => n.type === 'complaint')).toHaveLength(1);
});
