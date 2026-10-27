import type { PrismaClient } from '../../generated/prisma/client.js';
import type { Principal } from '../../middleware/auth.js';
import { withInstitutions } from '../complaints/transaction.js';
import { authorizedLink } from '../case-links/access.js';
import { AppError } from '../../lib/errors.js';
import type { WorkspaceRepository, WorkspaceTransaction } from './workspace.js';
export class PrismaWorkspaceRepository implements WorkspaceRepository {
  constructor(
    private db: PrismaClient,
    private principal: Principal,
    private institutionId: string,
  ) {}
  transaction<T>(work: (tx: WorkspaceTransaction) => Promise<T>) {
    return withInstitutions(this.db, [this.institutionId], async (tx) => {
      const touched = new Map<string, string[]>();
      return work({
        load: async (id) => {
          const row = await tx.coordinationWorkspace.findUnique({
            where: { id },
            include: { sharedActions: true },
          });
          if (!row) return null;
          const link = await authorizedLink(tx, this.principal, row.caseLinkId);
          if (link.status !== 'CONFIRMED')
            throw new AppError(
              409,
              'INVALID_STATE',
              'Workspace requires a confirmed relationship',
            );
          if (
            link.sourceComplaint.institutionId !== this.institutionId ||
            link.targetComplaint.institutionId !== this.institutionId
          )
            throw new AppError(
              409,
              'CASE_CHANGED',
              'Institution changed; reload',
            );
          const complaintIds = [link.sourceComplaintId, link.targetComplaintId];
          touched.set(id, complaintIds);
          return {
            id: row.id,
            caseLinkId: row.caseLinkId,
            coordinatorId: row.coordinatorId,
            status: row.status,
            version: row.version,
            complaintIds,
            involvedBureauIds: [
              ...new Set([
                link.sourceComplaint.bureauId,
                link.targetComplaint.bureauId,
              ]),
            ],
            sharedActionIds: row.sharedActions.map((a) => a.actionId),
          };
        },
        officer: (id) =>
          tx.user.findUnique({
            where: { id },
            select: { id: true, bureauId: true, active: true },
          }),
        action: (id) =>
          tx.investigationAction.findUnique({
            where: { id },
            select: {
              id: true,
              complaintId: true,
              bureauId: true,
              status: true,
            },
          }),
        save: async (next, expectedVersion) => {
          const changed = await tx.coordinationWorkspace.updateMany({
            where: { id: next.id, version: expectedVersion },
            data: {
              version: next.version,
              coordinatorId: next.coordinatorId,
              status: next.status,
            },
          });
          if (!changed.count) return false;
          for (const actionId of next.sharedActionIds)
            await tx.coordinationSharedAction.upsert({
              where: {
                workspaceId_actionId: { workspaceId: next.id, actionId },
              },
              create: {
                workspaceId: next.id,
                actionId,
                linkedById: this.principal.id,
              },
              update: {},
            });
          return true;
        },
        audit: async (event) => {
          for (const complaintId of touched.get(event.workspaceId) ?? [])
            await tx.auditLog.create({
              data: {
                actorId: event.actorId,
                complaintId,
                event: 'COORDINATION_WORKSPACE_UPDATED',
                metadata: {
                  workspaceId: event.workspaceId,
                  operation: event.operation,
                  version: event.version,
                  fromStatus: event.fromStatus,
                  toStatus: event.toStatus,
                  fromCoordinatorId: event.fromCoordinatorId,
                  toCoordinatorId: event.toCoordinatorId,
                  actionId: event.actionId,
                },
              },
            });
        },
      });
    });
  }
}
