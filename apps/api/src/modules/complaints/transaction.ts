import type { PrismaClient, Prisma } from '../../generated/prisma/client.js';
/** Uses exactly the intelligence lock namespace. Sorted acquisition prevents move/move deadlocks. */
export function withInstitutions<T>(
  db: PrismaClient,
  ids: string[],
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
      for (const id of [...new Set(ids)].sort())
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`casebridge:institution:${id}`},0))::text AS locked`;
      return work(tx);
    },
    { isolationLevel: 'ReadCommitted', maxWait: 5000, timeout: 15000 },
  );
}
