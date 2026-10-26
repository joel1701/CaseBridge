import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';
let client: PrismaClient | undefined;
export function getPrisma(): PrismaClient {
  if (!env.DATABASE_URL)
    throw new Error('DATABASE_URL is required for database operations');
  client ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
  return client;
}
export async function disconnectPrisma() {
  await client?.$disconnect();
}
