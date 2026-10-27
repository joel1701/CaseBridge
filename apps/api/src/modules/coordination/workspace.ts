/** Pending Vishwak's schema adapter. No HTTP route pretends this persists today. */
import type { Principal } from '../../middleware/auth.js';
import { requireReviewer } from '../case-links/access.js';
import { AppError } from '../../lib/errors.js';
export interface CoordinationWorkspace {
  id: string;
  caseLinkId: string;
  involvedBureauIds: string[];
  complaintIds: string[];
  coordinatorId: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  version: number;
  sharedActionIds: string[];
}
export interface WorkspaceTransaction {
  load(id: string): Promise<CoordinationWorkspace | null>;
  officer(
    id: string,
  ): Promise<{ id: string; bureauId: string | null; active: boolean } | null>;
  action(id: string): Promise<{
    id: string;
    complaintId: string;
    bureauId: string;
    status: string;
  } | null>;
  save(
    workspace: CoordinationWorkspace,
    expectedVersion: number,
  ): Promise<boolean>;
  audit(event: {
    actorId: string;
    workspaceId: string;
    operation: string;
    version: number;
  }): Promise<void>;
}
export interface WorkspaceRepository {
  transaction<T>(work: (tx: WorkspaceTransaction) => Promise<T>): Promise<T>;
}
export type WorkspaceCommand =
  | { kind: 'ASSIGN'; officerId: string }
  | { kind: 'TRACK_ACTION'; actionId: string }
  | { kind: 'SET_STATUS'; status: CoordinationWorkspace['status'] };
export class CoordinationWorkspaceService {
  constructor(private repository: WorkspaceRepository) {}
  async update(
    principal: Principal,
    id: string,
    expectedVersion: number,
    command: WorkspaceCommand,
  ) {
    requireReviewer(principal);
    return this.repository.transaction(async (tx) => {
      const current = await tx.load(id);
      if (
        !current ||
        (principal.role !== 'ADMIN' &&
          !current.involvedBureauIds.includes(principal.bureauId ?? ''))
      )
        throw new AppError(404, 'NOT_FOUND', 'Workspace not found');
      if (current.version !== expectedVersion)
        throw new AppError(409, 'STALE_COORDINATION', 'Workspace changed');
      const next = {
        ...current,
        sharedActionIds: [...current.sharedActionIds],
        version: current.version + 1,
      };
      if (command.kind === 'ASSIGN') {
        const officer = await tx.officer(command.officerId);
        if (
          !officer?.active ||
          !officer.bureauId ||
          !current.involvedBureauIds.includes(officer.bureauId) ||
          (principal.role !== 'ADMIN' &&
            officer.bureauId !== principal.bureauId)
        )
          throw new AppError(
            403,
            'FORBIDDEN',
            'Assign an active officer in your involved bureau',
          );
        next.coordinatorId = officer.id;
      } else if (command.kind === 'TRACK_ACTION') {
        const action = await tx.action(command.actionId);
        if (
          !action ||
          !current.complaintIds.includes(action.complaintId) ||
          !current.involvedBureauIds.includes(action.bureauId) ||
          (principal.role !== 'ADMIN' && action.bureauId !== principal.bureauId)
        )
          throw new AppError(404, 'NOT_FOUND', 'Action not found');
        next.sharedActionIds = [
          ...new Set([...next.sharedActionIds, action.id]),
        ];
      } else {
        if (current.status === 'COMPLETED' && command.status !== 'COMPLETED')
          throw new AppError(
            409,
            'INVALID_STATE',
            'Completed workspaces cannot be reopened by this contract',
          );
        if (command.status !== 'OPEN' && !next.coordinatorId)
          throw new AppError(
            409,
            'INVALID_STATE',
            'Assign a coordinator first',
          );
        next.status = command.status;
      }
      if (!(await tx.save(next, expectedVersion)))
        throw new AppError(409, 'STALE_COORDINATION', 'Workspace changed');
      await tx.audit({
        actorId: principal.id,
        workspaceId: id,
        operation: command.kind,
        version: next.version,
      });
      return next;
    });
  }
}
