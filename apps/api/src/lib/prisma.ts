import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppError } from './errors.js';
import { env } from './env.js';
let client: PrismaClient | undefined;
export function getPrisma(): PrismaClient {
  if (!env.DATABASE_URL)
    throw new AppError(
      503,
      'DATABASE_NOT_CONFIGURED',
      'Database connection is not configured',
    );
  client ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
  return client;
}
export async function disconnectPrisma() {
  await client?.$disconnect();
}
