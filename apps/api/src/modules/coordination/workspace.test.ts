import { it, expect, vi } from 'vitest';
import {
  CoordinationWorkspaceService,
  type CoordinationWorkspace,
  type WorkspaceRepository,
  type WorkspaceTransaction,
} from './workspace.js';
const principal = {
  id: 'head',
  role: 'BUREAU_HEAD' as const,
  bureauId: 'PGRC',
};
function repository() {
  let state: CoordinationWorkspace = {
    id: 'w',
    caseLinkId: 'l',
    involvedBureauIds: ['PGRC', 'RB'],
    complaintIds: ['a', 'b'],
    coordinatorId: null,
    status: 'OPEN',
    version: 0,
    sharedActionIds: [],
  };
  const audit = vi.fn();
  const tx: WorkspaceTransaction = {
    load: async () => structuredClone(state),
    officer: async (id) => ({
      id,
      bureauId: id === 'other' ? 'RB' : 'PGRC',
      active: true,
    }),
    action: async (id) => ({
      id,
      complaintId: 'a',
      bureauId: 'PGRC',
      status: 'PLANNED',
    }),
    save: async (value, version) => {
      if (state.version !== version) return false;
      state = value;
      return true;
    },
    audit,
  };
  const repo: WorkspaceRepository = { transaction: (work) => work(tx) };
  return { repo, audit };
}
it('validates coordinator assignment, action tracking, responsibility and status with a typed test double', async () => {
  const { repo, audit } = repository();
  const service = new CoordinationWorkspaceService(repo);
  await expect(
    service.update(principal, 'w', 0, { kind: 'ASSIGN', officerId: 'other' }),
  ).rejects.toMatchObject({ status: 403 });
  const assigned = await service.update(principal, 'w', 0, {
    kind: 'ASSIGN',
    officerId: 'own',
  });
  expect(assigned.coordinatorId).toBe('own');
  const tracked = await service.update(principal, 'w', 1, {
    kind: 'TRACK_ACTION',
    actionId: 'action1',
  });
  expect(tracked.sharedActionIds).toEqual(['action1']);
  expect(
    (
      await service.update(principal, 'w', 2, {
        kind: 'SET_STATUS',
        status: 'IN_PROGRESS',
      })
    ).status,
  ).toBe('IN_PROGRESS');
  expect(audit).toHaveBeenCalledTimes(3);
  await expect(
    service.update(principal, 'w', 0, {
      kind: 'SET_STATUS',
      status: 'COMPLETED',
    }),
  ).rejects.toMatchObject({ code: 'STALE_COORDINATION' });
});
