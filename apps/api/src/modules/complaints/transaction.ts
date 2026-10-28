import type { PrismaClient, Prisma } from '../../generated/prisma/client.js';
import { asDependencyError } from '../../lib/errors.js';
/** Uses exactly the intelligence lock namespace. Sorted acquisition prevents move/move deadlocks. */
export async function withInstitutions<T>(
  db: PrismaClient,
  ids: string[],
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  try {
    return await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
        for (const id of [...new Set(ids)].sort())
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`casebridge:institution:${id}`},0))::text AS locked`;
        return work(tx);
      },
      { isolationLevel: 'ReadCommitted', maxWait: 5000, timeout: 15000 },
    );
  } catch (error) {
    throw asDependencyError(error);
  }
}
