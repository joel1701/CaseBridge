import { describe, it, expect } from 'vitest';
import { detectOverlaps } from './rules.js';
import { FirewallService } from './service.js';
import { parseInput } from '../case-links/access.js';
import { createActionSchema } from './validation.js';
import type {
  FirewallRepository,
  FirewallTransaction,
  AuditEntry,
  ExistingAction,
} from './types.js';
import { AppError } from '../../lib/errors.js';
const principal = { id: 'u1', bureauId: 'PGRC', role: 'OFFICER' as const };
const complaint = {
  id: 'c1',
  institutionId: 'i1',
  bureauId: 'PGRC',
  category: 'FEES',
  updatedAt: new Date(0),
};
const input = {
  complaintId: 'c1',
  type: 'EVIDENCE_REQUEST' as const,
  summary: 'Request admission fee ledger',
  evidenceScope: 'admission-fees:2026-Q3',
};
const action: ExistingAction = {
  id: 'a1',
  complaintId: 'c2',
  bureauId: 'RB',
  type: 'EVIDENCE_REQUEST',
  status: 'IN_PROGRESS',
  summary: 'Request the fee ledger',
  evidenceScope: 'admission fees:2026 Q3',
  dueAt: null,
  complaint: { institutionId: 'i1', category: 'FEES' },
  bureau: { code: 'RB' },
};
/** Explicit transaction test double. Tests service interleaving, not PostgreSQL lock semantics. */
function store(initial: ExistingAction[] = []) {
  const state = {
    actions: [...initial],
    audits: [] as AuditEntry[],
    failAudit: false,
  };
  let queue: Promise<unknown> = Promise.resolve();
  const tx: FirewallTransaction = {
    async complaint(p, id) {
      if (p.bureauId !== 'PGRC' || id !== 'c1')
        throw new AppError(404, 'NOT_FOUND', 'Missing');
      return complaint;
    },
    async activeActions() {
      return [...state.actions];
    },
    async create(p, c, value) {
      const id = `new-${state.actions.length}`;
      state.actions.push({
        ...action,
        id,
        bureauId: c.bureauId,
        complaintId: c.id,
        evidenceScope: value.evidenceScope ?? null,
      });
      return {
        id,
        complaintId: c.id,
        bureauId: c.bureauId,
        createdById: p.id,
        type: value.type,
        status: 'PLANNED',
        createdAt: new Date(),
      };
    },
    async audit(entry) {
      if (state.failAudit) throw new Error('Audit unavailable');
      state.audits.push(entry);
    },
  };
  const repository: FirewallRepository = {
    ...tx,
    transaction<T>(
      _id: string,
      work: (unit: FirewallTransaction) => Promise<T>,
    ) {
      const next = queue.then(async () => {
        const before = structuredClone(state);
        try {
          return await work(tx);
        } catch (error) {
          state.actions = before.actions;
          state.audits = before.audits;
          throw error;
        }
      });
      queue = next.catch(() => {});
      return next;
    },
  };
  return { state, repository };
}
describe('Action Firewall rules and submission', () => {
  it('warns on duplicate cross-bureau evidence, but redacts private IDs', () => {
    const [finding] = detectOverlaps(principal, complaint, input, [action]);
    expect(finding.warning).toMatchObject({
      code: 'POSSIBLE_DUPLICATE',
      severity: 'HIGH',
      relatedBureauCode: 'RB',
      relatedActionId: null,
      relatedComplaintId: null,
      restricted: true,
    });
    expect(finding.actionId).toBe('a1');
  });
  it('identifies the existing action for an authorized global reviewer', () => {
    expect(
      detectOverlaps({ ...principal, role: 'ADMIN' }, complaint, input, [
        action,
      ])[0].warning.relatedActionId,
    ).toBe('a1');
  });
  it('permits independent scopes, periods, institutions and finished actions', () => {
    for (const item of [
      {
        ...action,
        evidenceScope: 'laboratory roof',
        complaint: { institutionId: 'i1', category: 'INFRASTRUCTURE' },
      },
      { ...action, evidenceScope: 'admission-fees:2025-Q3' },
      { ...action, complaint: { institutionId: 'i2', category: 'FEES' } },
      { ...action, status: 'COMPLETED' },
    ])
      expect(detectOverlaps(principal, complaint, input, [item])).toEqual([]);
  });
  it('flags possible notice/inspection timing conflict without a legal determination', () => {
    expect(
      detectOverlaps(principal, complaint, { ...input, type: 'NOTICE' }, [
        { ...action, type: 'INSPECTION' },
      ])[0].warning.code,
    ).toBe('POSSIBLE_CONFLICT');
  });
  it('requires a reason; denied attempts and authorized overrides are audited', async () => {
    const { state, repository } = store([action]);
    const service = new FirewallService(repository);
    await expect(service.create(principal, input)).rejects.toMatchObject({
      code: 'REVIEW_REQUIRED',
      status: 409,
    });
    expect(state.actions).toHaveLength(1);
    expect(state.audits[0].event).toBe('ACTION_REVIEW_REQUIRED');
    const created = await service.create(principal, {
      ...input,
      overrideReason:
        'Distinct legally required follow-up; coordinated with RB.',
    });
    expect(created.createdById).toBe(principal.id);
    expect(state.actions).toHaveLength(2);
    expect(state.audits[1].event).toBe('ACTION_OVERRIDE_CREATED');
  });
  it('serializes simultaneous submissions and rechecks after the first commit', async () => {
    const { state, repository } = store();
    const service = new FirewallService(repository);
    const outcomes = await Promise.allSettled([
      service.create(principal, input),
      service.create(principal, input),
    ]);
    expect(outcomes.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(state.actions).toHaveLength(1);
    expect(state.audits.map((a) => a.event)).toEqual([
      'ACTION_CREATED',
      'ACTION_REVIEW_REQUIRED',
    ]);
  });
  it('rolls back action if its audit cannot persist', async () => {
    const { state, repository } = store();
    state.failAudit = true;
    await expect(
      new FirewallService(repository).create(principal, input),
    ).rejects.toThrow('Audit unavailable');
    expect(state.actions).toHaveLength(0);
  });
  it('rejects whitespace overrides, injected owners, and evidence requests with no scope', () => {
    for (const value of [
      { ...input, overrideReason: ' ' },
      { ...input, bureauId: 'RB' },
      { ...input, evidenceScope: undefined },
    ])
      expect(() => parseInput(createActionSchema, value)).toThrow();
  });
  it('denies out-of-bureau action submission', async () => {
    const { repository } = store();
    await expect(
      new FirewallService(repository).create(
        { ...principal, bureauId: 'RB' },
        input,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
});
