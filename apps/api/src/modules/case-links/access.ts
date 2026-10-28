import { z, type ZodType } from 'zod';
import type { Prisma } from '../../generated/prisma/client.js';
import { bureauScope, type Principal } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';
export type Database = Prisma.TransactionClient;
export const idSchema = z.string().trim().min(1).max(128);
export const paginationSchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export function parseInput<T>(schema: ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      parsed.error.issues.map(({ path, message }) => ({ path, message })),
    );
  return parsed.data;
}
export function canRead(principal: Principal, complaint: { bureauId: string }) {
  return (
    principal.role === 'ADMIN' ||
    (principal.bureauId !== null && principal.bureauId === complaint.bureauId)
  );
}
export function requireReviewer(principal: Principal) {
  if (!['ADMIN', 'BUREAU_HEAD'].includes(principal.role))
    throw new AppError(
      403,
      'FORBIDDEN',
      'Bureau head or administrator required',
    );
}
export function linkScope(principal: Principal): Prisma.CaseLinkWhereInput {
  if (principal.role === 'ADMIN') return {};
  const scope = bureauScope(principal);
  return { OR: [{ sourceComplaint: scope }, { targetComplaint: scope }] };
}
export async function authorizedComplaint(
  db: Database,
  principal: Principal,
  id: string,
) {
  const record = await db.complaint.findFirst({
    where: { id, ...bureauScope(principal) },
    include: { bureau: true },
  });
  if (!record) throw new AppError(404, 'NOT_FOUND', 'Complaint not found');
  return record;
}
export async function authorizedLink(
  db: Database,
  principal: Principal,
  id: string,
) {
  const link = await db.caseLink.findFirst({
    where: { id, ...linkScope(principal) },
    include: {
      sourceComplaint: { include: { bureau: true } },
      targetComplaint: { include: { bureau: true } },
    },
  });
  if (!link)
    throw new AppError(404, 'NOT_FOUND', 'Case relationship not found');
  return link;
}
