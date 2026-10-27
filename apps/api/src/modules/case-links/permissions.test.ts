import { it, expect, vi } from 'vitest';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { CaseLinkService } from './service.js';
import { CoordinationService } from '../coordination/service.js';
import { permittedExplanation } from './serialization.js';
it('rejects officer confirmation and coordination before any repository call', async () => {
  const db = { $transaction: vi.fn() } as unknown as PrismaClient;
  const principal = { id: 'u', role: 'OFFICER' as const, bureauId: 'PGRC' };
  await expect(
    new CaseLinkService(db).review(principal, 'l', {
      status: 'CONFIRMED',
      reason: 'review',
      expectedUpdatedAt: new Date().toISOString(),
    }),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    new CoordinationService(db).record(principal, {
      caseLinkId: 'l',
      type: 'SHARE_EVIDENCE',
      rationale: 'reason',
    }),
  ).rejects.toMatchObject({ status: 403 });
  expect(db.$transaction).not.toHaveBeenCalled();
});
it('does not leak arbitrary explanation text across bureaus', () => {
  const result = permittedExplanation(
    {
      reasons: ['PRIVATE CONTACT'],
      description: 'PRIVATE CONTACT',
      semanticSimilarity: 0.6,
      institutionMatch: true,
    },
    true,
  );
  expect(JSON.stringify(result)).not.toContain('PRIVATE CONTACT');
});
