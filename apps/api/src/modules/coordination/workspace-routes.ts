import { Router } from 'express';
import { z } from 'zod';
import { getPrisma } from '../../lib/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import {
  requireAuth,
  requireRole,
  type Principal,
} from '../../middleware/auth.js';
import {
  parseInput,
  idSchema,
  authorizedLink,
  authorizedComplaint,
  linkScope,
  paginationSchema,
} from '../case-links/access.js';
import { withInstitutions } from '../complaints/transaction.js';
import { AppError } from '../../lib/errors.js';
import { CoordinationWorkspaceService } from './workspace.js';
import { PrismaWorkspaceRepository } from './workspace-repository.js';
export const router = Router();
const command = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('ASSIGN'), officerId: idSchema }),
  z.strictObject({ kind: z.literal('TRACK_ACTION'), actionId: idSchema }),
  z.strictObject({
    kind: z.literal('SET_STATUS'),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']),
  }),
]);
const permittedFor = (p: Principal) => (bureauId: string | null) =>
  p.role === 'ADMIN' || bureauId === p.bureauId;
export function readWorkspace(p: Principal, id: string) {
  return getPrisma().$transaction((tx) => serializeWorkspace(tx, p, id), {
    isolationLevel: 'RepeatableRead',
  });
}
async function serializeWorkspace(
  tx: Prisma.TransactionClient,
  p: Principal,
  id: string,
) {
  const row = await tx.coordinationWorkspace.findUnique({
    where: { id },
    include: {
      coordinator: { select: { id: true, bureauId: true } },
      sharedActions: {
        include: {
          action: {
            select: {
              id: true,
              bureauId: true,
              complaintId: true,
              complaint: { select: { bureauId: true } },
            },
          },
        },
      },
    },
  });
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Workspace not found');
  const link = await authorizedLink(tx, p, row.caseLinkId);
  const permitted = permittedFor(p);
  return {
    id: row.id,
    caseLinkId: row.caseLinkId,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    coordinatorId:
      row.coordinator && permitted(row.coordinator.bureauId)
        ? row.coordinatorId
        : null,
    coordinatorRestricted:
      !!row.coordinator && !permitted(row.coordinator.bureauId),
    involvedBureauIds: [
      ...new Set([
        link.sourceComplaint.bureauId,
        link.targetComplaint.bureauId,
      ]),
    ],
    complaintIds: [link.sourceComplaint, link.targetComplaint]
      .filter((c) => permitted(c.bureauId))
      .map((c) => c.id),
    sharedActionIds: row.sharedActions
      .filter(
        (s) =>
          permitted(s.action.bureauId) &&
          permitted(s.action.complaint.bureauId),
      )
      .map((s) => s.actionId),
  };
}
router.post(
  '/coordination/workspaces',
  requireAuth,
  requireRole('ADMIN', 'BUREAU_HEAD'),
  async (req, res) => {
    const { caseLinkId } = parseInput(
        z.strictObject({ caseLinkId: idSchema }),
        req.body,
      ),
      p = req.principal!,
      db = getPrisma();
    const initial = await authorizedLink(db, p, caseLinkId);
    const row = await withInstitutions(
      db,
      [initial.sourceComplaint.institutionId],
      async (tx) => {
        const link = await authorizedLink(tx, p, caseLinkId);
        if (link.status !== 'CONFIRMED')
          throw new AppError(
            409,
            'INVALID_STATE',
            'Confirm the case relationship first',
          );
        if (
          link.sourceComplaint.institutionId !==
            initial.sourceComplaint.institutionId ||
          link.targetComplaint.institutionId !==
            link.sourceComplaint.institutionId
        )
          throw new AppError(
            409,
            'CASE_CHANGED',
            'Institution changed; reload',
          );
        const workspace = await tx.coordinationWorkspace.create({
          data: { caseLinkId, createdById: p.id },
        });
        for (const complaintId of [
          link.sourceComplaintId,
          link.targetComplaintId,
        ])
          await tx.auditLog.create({
            data: {
              actorId: p.id,
              complaintId,
              event: 'COORDINATION_WORKSPACE_CREATED',
              metadata: { workspaceId: workspace.id },
            },
          });
        return workspace;
      },
    );
    res
      .status(201)
      .json({ success: true, data: await readWorkspace(p, row.id) });
  },
);
router.get('/coordination/workspaces', requireAuth, async (req, res) => {
  const q = parseInput(
      paginationSchema.extend({
        caseLinkId: idSchema.optional(),
        complaintId: idSchema.optional(),
        status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']).optional(),
      }),
      req.query,
    ),
    p = req.principal!;
  const where: Prisma.CoordinationWorkspaceWhereInput = {
    caseLinkId: q.caseLinkId,
    status: q.status,
    caseLink: {
      AND: [
        linkScope(p),
        q.complaintId
          ? {
              OR: [
                { sourceComplaintId: q.complaintId },
                { targetComplaintId: q.complaintId },
              ],
            }
          : {},
      ],
    },
  };
  // One snapshot for the page, its count and every serialized workspace.
  const { items, total } = await getPrisma().$transaction(
    async (tx) => {
      if (q.complaintId) await authorizedComplaint(tx, p, q.complaintId);
      const rows = await tx.coordinationWorkspace.findMany({
        where,
        select: { id: true },
        orderBy: { id: 'asc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      });
      const items = [];
      for (const row of rows)
        items.push(await serializeWorkspace(tx, p, row.id));
      return { items, total: await tx.coordinationWorkspace.count({ where }) };
    },
    { isolationLevel: 'RepeatableRead' },
  );
  res.json({
    success: true,
    data: { items },
    meta: { page: q.page, pageSize: q.pageSize, total },
  });
});
// Explicit whitelist of workspace audit fields; anything else in metadata is ignored.
const historyMetadata = z.object({
  operation: z.string().optional(),
  version: z.number().optional(),
  fromStatus: z.string().optional(),
  toStatus: z.string().optional(),
  fromCoordinatorId: z.string().nullable().optional(),
  toCoordinatorId: z.string().nullable().optional(),
  actionId: z.string().nullable().optional(),
});
router.get(
  '/coordination/workspaces/:id/history',
  requireAuth,
  async (req, res) => {
    const id = parseInput(idSchema, req.params.id),
      p = req.principal!,
      permitted = permittedFor(p);
    const items = await getPrisma().$transaction(
      async (tx) => {
        await serializeWorkspace(tx, p, id);
        const rows = await tx.auditLog.findMany({
          where: {
            event: {
              in: [
                'COORDINATION_WORKSPACE_CREATED',
                'COORDINATION_WORKSPACE_UPDATED',
              ],
            },
            metadata: { path: ['workspaceId'], equals: id },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          include: { actor: { select: { bureauId: true } } },
          take: 1000,
        });
        // Each event is audited once per linked complaint; keep one entry per version.
        const seen = new Set<string>();
        const entries = rows.flatMap((row) => {
          const meta = historyMetadata.safeParse(row.metadata);
          const m = meta.success ? meta.data : {};
          const key = `${row.event}:${m.version ?? 0}`;
          if (seen.has(key)) return [];
          seen.add(key);
          return [{ row, m }];
        });
        const userIds = entries.flatMap(({ m }) =>
            [m.fromCoordinatorId, m.toCoordinatorId].filter(
              (v): v is string => !!v,
            ),
          ),
          actionIds = entries.flatMap(({ m }) =>
            m.actionId ? [m.actionId] : [],
          );
        const users = new Map(
          (
            await tx.user.findMany({
              where: { id: { in: userIds } },
              select: { id: true, bureauId: true },
            })
          ).map((u) => [u.id, permitted(u.bureauId)]),
        );
        const actions = new Map(
          (
            await tx.investigationAction.findMany({
              where: { id: { in: actionIds } },
              select: {
                id: true,
                bureauId: true,
                complaint: { select: { bureauId: true } },
              },
            })
          ).map((a) => [
            a.id,
            permitted(a.bureauId) && permitted(a.complaint.bureauId),
          ]),
        );
        const visible = (userId: string | null | undefined) =>
          userId && users.get(userId) ? userId : null;
        return entries.map(({ row, m }) => ({
          event: row.event,
          operation: m.operation ?? null,
          version: m.version ?? 0,
          fromStatus: m.fromStatus ?? null,
          toStatus: m.toStatus ?? null,
          actorId:
            p.role === 'ADMIN' || row.actor?.bureauId === p.bureauId
              ? row.actorId
              : null,
          fromCoordinatorId: visible(m.fromCoordinatorId),
          toCoordinatorId: visible(m.toCoordinatorId),
          coordinatorRestricted:
            (!!m.fromCoordinatorId && !visible(m.fromCoordinatorId)) ||
            (!!m.toCoordinatorId && !visible(m.toCoordinatorId)),
          actionId: m.actionId && actions.get(m.actionId) ? m.actionId : null,
          actionRestricted: !!m.actionId && !actions.get(m.actionId),
          createdAt: row.createdAt,
        }));
      },
      { isolationLevel: 'RepeatableRead' },
    );
    res.json({ success: true, data: { items } });
  },
);
router.get('/coordination/workspaces/:id', requireAuth, async (req, res) =>
  res.json({
    success: true,
    data: await readWorkspace(
      req.principal!,
      parseInput(idSchema, req.params.id),
    ),
  }),
);
router.patch(
  '/coordination/workspaces/:id',
  requireAuth,
  requireRole('ADMIN', 'BUREAU_HEAD'),
  async (req, res) => {
    const id = parseInput(idSchema, req.params.id),
      body = parseInput(
        z.strictObject({
          expectedVersion: z.number().int().nonnegative(),
          command,
        }),
        req.body,
      ),
      p = req.principal!,
      db = getPrisma();
    const row = await db.coordinationWorkspace.findUnique({ where: { id } });
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Workspace not found');
    const link = await authorizedLink(db, p, row.caseLinkId);
    await new CoordinationWorkspaceService(
      new PrismaWorkspaceRepository(db, p, link.sourceComplaint.institutionId),
    ).update(p, id, body.expectedVersion, body.command);
    res.json({ success: true, data: await readWorkspace(p, id) });
  },
);
