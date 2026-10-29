import type { PrismaClient } from '../../generated/prisma/client.js';
import type { Database } from './access.js';
import { AppError } from '../../lib/errors.js';
/** All institution-scoped intelligence writes take this transaction-level lock.
 * READ COMMITTED is deliberate: the query AFTER a waited lock sees the previous
 * submitter's committed action. Never replace with a pre-lock snapshot.
 * Hash collisions only serialize unrelated institutions; they cannot skip checks.
 */
export async function withInstitutionLock<T>(
  db: PrismaClient,
  institutionId: string,
  work: (tx: Database) => Promise<T>,
): Promise<T> {
  try {
    return await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`setu:institution:${institutionId}`}, 0))::text AS locked`;
        return work(tx);
      },
      { isolationLevel: 'ReadCommitted', maxWait: 5000, timeout: 15000 },
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    const code =
      typeof error === 'object' && error && 'code' in error
        ? error.code
        : undefined;
    if (
      ['P2028', 'P2034', 'P2010', 'P1001', 'P1002', 'P1017'].includes(
        String(code),
      )
    )
      throw new AppError(
        503,
        'DEPENDENCY_UNAVAILABLE',
        'Database busy or unavailable; retry the request',
      );
    throw error;
  }
}
