import type {
  PrismaClient,
  Prisma,
  ComplaintStatus,
} from '../../generated/prisma/client.js';
import type { z } from 'zod';
import { bureauScope, type Principal } from '../../middleware/auth.js';
import { authorizedComplaint, requireReviewer } from '../case-links/access.js';
import { AppError } from '../../lib/errors.js';
import { recordAudit } from '../case-history/service.js';
import { withInstitutions } from './transaction.js';
import { closeAlerts } from '../alerts/service.js';
import type {
  CreateComplaint,
  ComplaintChanges,
  listSchema,
} from './validation.js';
export const transitions: Record<ComplaintStatus, ComplaintStatus[]> = {
  RECEIVED: ['UNDER_PROCESS', 'ESCALATED', 'DISPOSED'],
  UNDER_PROCESS: ['ESCALATED', 'DISPOSED'],
  TRANSFERRED: ['UNDER_PROCESS', 'ESCALATED', 'DISPOSED'],
  ESCALATED: ['UNDER_PROCESS', 'DISPOSED'],
  DISPOSED: [],
};
export function checkTransition(from: ComplaintStatus, to: ComplaintStatus) {
  if (from !== to && !transitions[from].includes(to))
    throw new AppError(
      409,
      'INVALID_STATE',
      'Invalid complaint status transition',
    );
}
export function complaintFilter(
  p: Principal,
  q: z.infer<typeof listSchema>,
): Prisma.ComplaintWhereInput {
  if (q.bureauId && p.role !== 'ADMIN' && q.bureauId !== p.bureauId)
    throw new AppError(403, 'FORBIDDEN', 'Bureau filter is outside your scope');
  return {
    ...bureauScope(p),
    ...(q.bureauId ? { bureauId: q.bureauId } : {}),
    archivedAt: q.archived === 'true' ? { not: null } : null,
    status: q.status,
    institutionId: q.institutionId,
    category: q.category,
    assignedToId: q.assignedToId,
    ...(q.q
      ? {
          OR: ['title', 'originalId', 'description'].map((field) => ({
            [field]: { contains: q.q, mode: 'insensitive' },
          })),
        }
      : {}),
  };
}
export class ComplaintService {
  constructor(private db: PrismaClient) {}
  async list(p: Principal, q: z.infer<typeof listSchema>) {
    const where = complaintFilter(p, q);
    const [items, total] = await this.db.$transaction(
      [
        this.db.complaint.findMany({
          where,
          select: {
            id: true,
            originalId: true,
            institutionId: true,
            bureauId: true,
            sourceBureauId: true,
            title: true,
            category: true,
            status: true,
            overlapReviewStatus: true,
            assignedToId: true,
            dueAt: true,
            version: true,
            createdAt: true,
            updatedAt: true,
            archivedAt: true,
          },
          orderBy: [{ [q.sortBy]: q.sortOrder }, { id: 'asc' }],
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
        }),
        this.db.complaint.count({ where }),
      ],
      { isolationLevel: 'RepeatableRead' },
    );
    return { items, total };
  }
  detail(p: Principal, id: string) {
    return authorizedComplaint(this.db, p, id);
  }
  async createMany(p: Principal, items: CreateComplaint[]) {
    for (const row of items)
      if (p.role !== 'ADMIN' && row.bureauId !== p.bureauId)
        throw new AppError(403, 'FORBIDDEN', 'Create only in your bureau');
    return withInstitutions(
      this.db,
      items.map((r) => r.institutionId),
      async (tx) => {
        const result = [];
        for (const row of items) {
          if (
            !(await tx.institution.findUnique({
              where: { id: row.institutionId },
            })) ||
            !(await tx.bureau.findUnique({ where: { id: row.bureauId } }))
          )
            throw new AppError(
              404,
              'NOT_FOUND',
              'Institution or bureau not found',
            );
          const record = await tx.complaint.create({
            data: {
              ...row,
              sourceBureauId: row.bureauId,
              createdById: p.id,
              dueAt: row.dueAt ? new Date(row.dueAt) : null,
            },
          });
          await recordAudit(tx, p.id, record.id, 'COMPLAINT_CREATED', {
            originalId: record.originalId,
          });
          result.push(record);
        }
        return result;
      },
    );
  }
  async update(p: Principal, id: string, input: ComplaintChanges) {
    const initial = await authorizedComplaint(this.db, p, id);
    return withInstitutions(
      this.db,
      [
        initial.institutionId,
        ...(input.institutionId ? [input.institutionId] : []),
      ],
      async (tx) => {
        const current = await authorizedComplaint(tx, p, id);
        if (
          current.institutionId !== initial.institutionId ||
          current.version !== input.expectedVersion
        )
          throw new AppError(
            409,
            'STALE_COMPLAINT',
            'Complaint changed; reload',
          );
        if (current.archivedAt)
          throw new AppError(
            409,
            'INVALID_STATE',
            'Archived complaints cannot be modified',
          );
        const { expectedVersion, reason, ...changes } = input;
        const data: Prisma.ComplaintUncheckedUpdateInput = {
          ...changes,
          version: { increment: 1 },
        };
        const events: string[] = [];
        if (input.status) {
          checkTransition(current.status, input.status);
          if (input.status === 'DISPOSED') requireReviewer(p);
          data.resolvedAt =
            input.status === 'DISPOSED'
              ? (current.resolvedAt ?? new Date())
              : null;
          // Same-status requests are accepted but are not a lifecycle event.
          if (input.status !== current.status)
            events.push('COMPLAINT_STATUS_CHANGED');
        }
        if (input.assignedToId !== undefined) {
          requireReviewer(p);
          if (input.assignedToId) {
            const officer = await tx.user.findFirst({
              where: {
                id: input.assignedToId,
                active: true,
                bureauId: input.bureauId ?? current.bureauId,
              },
            });
            if (!officer)
              throw new AppError(
                404,
                'NOT_FOUND',
                'Active officer in destination bureau not found',
              );
          }
          events.push('COMPLAINT_ASSIGNED');
        }
        if (input.bureauId && input.bureauId !== current.bureauId) {
          if (p.role !== 'ADMIN')
            throw new AppError(
              403,
              'FORBIDDEN',
              'Only administrators may transfer ownership between bureaus',
            );
          if (current.status === 'DISPOSED')
            throw new AppError(
              409,
              'INVALID_STATE',
              'Disposed complaints cannot be transferred',
            );
          if (input.status)
            throw new AppError(
              400,
              'VALIDATION_ERROR',
              'Transfer sets TRANSFERRED status; omit status',
            );
          if (!(await tx.bureau.findUnique({ where: { id: input.bureauId } })))
            throw new AppError(
              404,
              'NOT_FOUND',
              'Destination bureau not found',
            );
          const workspaces = await tx.coordinationWorkspace.count({
            where: {
              caseLink: {
                OR: [{ sourceComplaintId: id }, { targetComplaintId: id }],
              },
            },
          });
          if (workspaces)
            throw new AppError(
              409,
              'COORDINATION_DEPENDENCY',
              'Ownership is referenced by a coordination workspace',
            );
          if (
            await tx.complaint.findFirst({
              where: {
                bureauId: input.bureauId,
                originalId: current.originalId,
              },
              select: { id: true },
            })
          )
            throw new AppError(
              409,
              'DUPLICATE_REFERENCE',
              'Destination bureau already holds this original reference',
            );
          data.sourceBureauId = current.sourceBureauId ?? current.bureauId;
          data.status = 'TRANSFERRED';
          data.assignedToId = input.assignedToId ?? null;
          await closeAlerts(tx, { complaintId: id });
          events.push('COMPLAINT_TRANSFERRED');
        }
        if (
          input.institutionId &&
          input.institutionId !== current.institutionId
        ) {
          requireReviewer(p);
          if (
            !(await tx.institution.findUnique({
              where: { id: input.institutionId },
            }))
          )
            throw new AppError(404, 'NOT_FOUND', 'Institution not found');
          if (
            await tx.caseLink.count({
              where: {
                OR: [{ sourceComplaintId: id }, { targetComplaintId: id }],
                AND: [
                  {
                    OR: [
                      { status: { not: 'REJECTED' } },
                      { workspace: { isNot: null } },
                    ],
                  },
                ],
              },
            })
          )
            throw new AppError(
              409,
              'RELATIONSHIP_DEPENDENCY',
              'Review existing links and coordination before changing institution',
            );
          events.push('COMPLAINT_REASSIGNED_INSTITUTION');
        }
        const result = await tx.complaint.updateMany({
          where: { id, version: expectedVersion },
          data,
        });
        if (result.count !== 1)
          throw new AppError(
            409,
            'STALE_COMPLAINT',
            'Complaint changed; reload',
          );
        for (const event of events.length ? events : ['COMPLAINT_UPDATED'])
          await recordAudit(tx, p.id, id, event, {
            reason,
            version: expectedVersion + 1,
            changedFields: Object.keys(changes),
            fromStatus: current.status,
            toStatus:
              input.bureauId && input.bureauId !== current.bureauId
                ? 'TRANSFERRED'
                : (input.status ?? current.status),
          });
        const updated = await tx.complaint.findUniqueOrThrow({ where: { id } });
        if (
          updated.status === 'DISPOSED' &&
          events.includes('COMPLAINT_STATUS_CHANGED')
        )
          await closeAlerts(tx, { complaintId: id });
        if (
          events.includes('COMPLAINT_STATUS_CHANGED') ||
          events.includes('COMPLAINT_TRANSFERRED')
        )
          await tx.alert.create({
            data: {
              bureauId: updated.bureauId,
              complaintId: id,
              userId: updated.assignedToId,
              type:
                updated.status === 'ESCALATED' ? 'ESCALATION' : 'STATUS_CHANGE',
              message:
                updated.status === 'ESCALATED'
                  ? 'Complaint escalated for review'
                  : 'Complaint status changed',
              dedupeKey: `status:${id}:${updated.version}`,
            },
          });
        return updated;
      },
    );
  }
  async archive(
    p: Principal,
    id: string,
    expectedVersion: number,
    reason: string,
  ) {
    if (p.role !== 'ADMIN')
      throw new AppError(
        403,
        'FORBIDDEN',
        'Only administrators may archive disposed complaints',
      );
    const current = await authorizedComplaint(this.db, p, id);
    return withInstitutions(this.db, [current.institutionId], async (tx) => {
      const record = await authorizedComplaint(tx, p, id);
      if (
        record.institutionId !== current.institutionId ||
        record.version !== expectedVersion
      )
        throw new AppError(409, 'STALE_COMPLAINT', 'Complaint changed');
      if (record.status !== 'DISPOSED')
        throw new AppError(
          409,
          'INVALID_STATE',
          'Dispose the complaint before archiving',
        );
      if (record.archivedAt)
        throw new AppError(409, 'INVALID_STATE', 'Complaint already archived');
      const result = await tx.complaint.update({
        where: { id },
        data: { archivedAt: new Date(), version: { increment: 1 } },
      });
      await closeAlerts(tx, { complaintId: id });
      await recordAudit(tx, p.id, id, 'COMPLAINT_ARCHIVED', {
        reason,
        version: result.version,
      });
      return result;
    });
  }
}
