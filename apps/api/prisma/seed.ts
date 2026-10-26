import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { getPrisma, disconnectPrisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/security.js';
const root = new URL('../../../data/', import.meta.url);
async function csv(name: string): Promise<unknown> {
  return parse(await readFile(new URL(name, root), 'utf8'), {
    columns: true,
    skip_empty_lines: true,
  });
}
async function seed() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Synthetic seed is disabled in production');
  const institutions = z
    .array(
      z.object({
        id: z.string(),
        permanentId: z.string(),
        name: z.string(),
        state: z.string(),
      }),
    )
    .parse(await csv('sample_institutions.csv'));
  const complaints = z
    .array(
      z.object({
        id: z.string(),
        originalId: z.string(),
        institutionId: z.string(),
        bureauId: z.string(),
        title: z.string(),
        description: z.string(),
        category: z.string(),
        status: z.enum([
          'RECEIVED',
          'UNDER_PROCESS',
          'TRANSFERRED',
          'ESCALATED',
          'DISPOSED',
        ]),
        overlapReviewStatus: z.enum(['NOT_REVIEWED', 'PENDING', 'REVIEWED']),
        createdAt: z.coerce.date(),
      }),
    )
    .parse(await csv('sample_complaints.csv'));
  const actions = z
    .array(
      z.object({
        id: z.string(),
        complaintId: z.string(),
        bureauId: z.string(),
        type: z.enum(['EVIDENCE_REQUEST', 'INSPECTION', 'NOTICE', 'REVIEW']),
        status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
        summary: z.string(),
        evidenceScope: z.string(),
        dueAt: z.coerce.date(),
      }),
    )
    .parse(
      JSON.parse(await readFile(new URL('sample_actions.json', root), 'utf8')),
    );
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (Boolean(email) !== Boolean(password))
    throw new Error('Supply both seed admin email and password or neither');
  const passwordHash = password ? await hashPassword(password) : undefined;
  if (email) z.email().parse(email);
  const db = getPrisma();
  await db.$transaction(async (tx) => {
    for (const [id, name] of [
      ['PGRC', 'Public Grievance Redressal Cell'],
      ['RB', 'Regulation Bureau'],
    ])
      await tx.bureau.upsert({
        where: { id },
        create: { id, code: id, name },
        update: {},
      });
    for (const row of institutions)
      await tx.institution.upsert({
        where: { id: row.id },
        create: row,
        update: {},
      });
    for (const row of complaints)
      await tx.complaint.upsert({
        where: { id: row.id },
        create: row,
        update: {},
      });
    for (const row of actions)
      await tx.investigationAction.upsert({
        where: { id: row.id },
        create: row,
        update: {},
      });
    // Labels remain in evaluation files. Seed only a clearly marked suggestion, not an AI score.
    await tx.caseLink.upsert({
      where: { id: 'link-demo-001' },
      create: {
        id: 'link-demo-001',
        sourceComplaintId: 'cmp-001',
        targetComplaintId: 'cmp-002',
        explanation: {
          source: 'synthetic-fixture',
          reasons: ['Same institution', 'Admission fee allegation'],
        },
        status: 'SUGGESTED',
      },
      update: {},
    });
    await tx.alert.upsert({
      where: { id: 'alert-demo-001' },
      create: {
        id: 'alert-demo-001',
        bureauId: 'PGRC',
        complaintId: 'cmp-001',
        type: 'OVERLAP',
        message: 'Synthetic case overlap awaits review',
      },
      update: {},
    });
    if (email && passwordHash)
      await tx.user.upsert({
        where: { email },
        create: {
          email,
          displayName: 'Demo administrator',
          passwordHash,
          role: 'ADMIN',
        },
        update: {},
      });
  });
  console.log('Synthetic seed complete; existing rows preserved.');
}
seed()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Seed failed');
    process.exitCode = 1;
  })
  .finally(disconnectPrisma);
