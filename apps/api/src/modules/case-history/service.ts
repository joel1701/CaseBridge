import type { Prisma } from '../../generated/prisma/client.js';
import { bureauScope, type Principal } from '../../middleware/auth.js';
import { authorizedComplaint } from '../case-links/access.js';
export function recordAudit(
  tx: Prisma.TransactionClient,
  actorId: string,
  complaintId: string,
  event: string,
  metadata: Prisma.InputJsonObject = {},
) {
  return tx.auditLog.create({
    data: { actorId, complaintId, event, metadata },
  });
}
// Event-specific whitelist: unknown metadata is empty even for admins. Never spread raw metadata.
const safeFields: Record<string, string[]> = {
  COMPLAINT_CREATED: ['originalId'],
  COMPLAINT_UPDATED: ['changedFields', 'reason', 'version'],
  COMPLAINT_ASSIGNED: ['reason', 'version'],
  COMPLAINT_STATUS_CHANGED: ['fromStatus', 'toStatus', 'reason', 'version'],
  COMPLAINT_TRANSFERRED: ['reason', 'version'],
  COMPLAINT_REASSIGNED_INSTITUTION: ['reason', 'version'],
  COMPLAINT_ARCHIVED: ['reason', 'version'],
  ACTION_CREATED: ['ruleVersion'],
  ACTION_REVIEW_REQUIRED: ['ruleVersion', 'warningCodes'],
  ACTION_OVERRIDE_CREATED: ['ruleVersion', 'warningCodes'],
  CASE_LINK_REVIEWED: ['status'],
  MATCH_ANALYSIS_COMPLETED: ['candidatesEvaluated'],
  COORDINATION_RECORDED: ['type'],
};
export function safeMetadata(
  event: string,
  metadata: unknown,
): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata))
    return {};
  const raw = metadata as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of safeFields[event] ?? []) {
    const v = raw[key];
    if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean' ||
      (Array.isArray(v) && v.every((x) => typeof x === 'string'))
    )
      result[key] = v;
  }
  return result;
}
export async function timeline(
  tx: Prisma.TransactionClient,
  p: Principal,
  id: string,
  page: number,
  pageSize: number,
) {
  await authorizedComplaint(tx, p, id);
  const where = { complaintId: id, complaint: bureauScope(p) };
  const [rows, total] = await Promise.all([
    tx.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { actor: { select: { bureauId: true } } },
    }),
    tx.auditLog.count({ where }),
  ]);
  return {
    items: rows.map((row) => ({
      id: row.id,
      event: row.event,
      actorId:
        p.role === 'ADMIN' || row.actor?.bureauId === p.bureauId
          ? row.actorId
          : null,
      createdAt: row.createdAt,
      metadata: safeMetadata(row.event, row.metadata),
    })),
    total,
  };
}
