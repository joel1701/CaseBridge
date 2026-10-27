import { Router } from 'express';
import { z } from 'zod';
import { getPrisma } from '../../lib/prisma.js';
import {
  requireAuth,
  requireRole,
  type Principal,
} from '../../middleware/auth.js';
import {
  parseInput,
  idSchema,
  authorizedLink,
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
export async function readWorkspace(p: Principal, id: string) {
  return getPrisma().$transaction(
    async (tx) => {
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
      const permitted = (bureauId: string | null) =>
        p.role === 'ADMIN' || bureauId === p.bureauId;
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
    },
    { isolationLevel: 'RepeatableRead' },
  );
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
              metadata: {},
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
      paginationSchema.extend({ caseLinkId: idSchema.optional() }),
      req.query,
    ),
    db = getPrisma();
  const where = {
    caseLinkId: q.caseLinkId,
    caseLink: linkScope(req.principal!),
  };
  const [rows, total] = await db.$transaction(
    [
      db.coordinationWorkspace.findMany({
        where,
        select: { id: true },
        orderBy: { id: 'asc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      db.coordinationWorkspace.count({ where }),
    ],
    { isolationLevel: 'RepeatableRead' },
  );
  const items = await Promise.all(
    rows.map((row) => readWorkspace(req.principal!, row.id)),
  );
  res.json({
    success: true,
    data: { items },
    meta: { page: q.page, pageSize: q.pageSize, total },
  });
});
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
