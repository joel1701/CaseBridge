import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { chmod, readFile, writeFile } from 'node:fs/promises';
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
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (Boolean(email) !== Boolean(password))
    throw new Error('Supply both seed admin email and password or neither');
  const passwordHash = password ? await hashPassword(password) : undefined;
  if (email) z.email().parse(email);
  const db = getPrisma();
  const demoPassword =
    process.env.SEED_DEMO_PASSWORD ?? randomBytes(24).toString('base64url');
  const demoHash = await hashPassword(demoPassword);
  const newCredentials: Array<{ email: string; password: string }> = [];

  await db.$transaction(
    async (tx) => {
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
          create: { ...row, sourceBureauId: row.bureauId },
          update: {},
        });
      for (const row of actions)
        await tx.investigationAction.upsert({
          where: { id: row.id },
          create: row,
          update: {},
        });
      const demoUserIds = new Map<string, string>();
      for (const [suffix, role, bureauId] of [
        ['pgrc-officer', 'OFFICER', 'PGRC'],
        ['pgrc-head', 'BUREAU_HEAD', 'PGRC'],
        ['rb-officer', 'OFFICER', 'RB'],
        ['rb-head', 'BUREAU_HEAD', 'RB'],
        ['admin', 'ADMIN', null],
      ] as const) {
        const demoEmail = `${suffix}@casebridge.example.invalid`;
        const existingUser = await tx.user.findUnique({
          where: { email: demoEmail },
        });
        demoUserIds.set(suffix, existingUser?.id ?? `demo-user-${suffix}`);
        if (!existingUser) {
          await tx.user.create({
            data: {
              id: `demo-user-${suffix}`,
              email: demoEmail,
              displayName: `Fictional ${suffix}`,
              role,
              bureauId,
              passwordHash: demoHash,
            },
          });
          newCredentials.push({ email: demoEmail, password: demoPassword });
        }
      }
      // Additional operations fixtures do not alter the labelled matching CSVs.
      const base = new Date('2026-10-27T00:00:00Z');
      for (let n = 26; n <= 125; n++) {
        const id = `ops-demo-${n}`,
          bureauId = n % 2 ? 'PGRC' : 'RB';
        const status =
          n % 7 === 0
            ? 'DISPOSED'
            : n % 5 === 0
              ? 'ESCALATED'
              : n % 3 === 0
                ? 'UNDER_PROCESS'
                : 'RECEIVED';
        const createdAt = new Date(base.getTime() - ((n % 60) + 2) * 86400000);
        await tx.complaint.upsert({
          where: { id },
          update: {},
          create: {
            id,
            originalId: `OPS-FICTIONAL-${n}`,
            institutionId: `inst-${String((n % 10) + 1).padStart(2, '0')}`,
            bureauId,
            sourceBureauId: bureauId,
            assignedToId: demoUserIds.get(
              `${bureauId === 'PGRC' ? 'pgrc' : 'rb'}-officer`,
            )!,
            title: `Fictional operational complaint ${n}`,
            description: `Synthetic training complaint ${n}: reported concerns require independent officer assessment. No real institution or allegation is represented.`,
            category: ['FEES', 'INFRASTRUCTURE', 'FACULTY'][n % 3],
            status,
            createdAt,
            dueAt: new Date(base.getTime() + ((n % 8) - 4) * 86400000),
            resolvedAt:
              status === 'DISPOSED'
                ? new Date(createdAt.getTime() + 86400000)
                : null,
          },
        });
        await tx.auditLog.upsert({
          where: { id: `ops-audit-${n}` },
          update: {},
          create: {
            id: `ops-audit-${n}`,
            complaintId: id,
            event: 'COMPLAINT_CREATED',
            metadata: {
              originalId: `OPS-FICTIONAL-${n}`,
              source: 'synthetic-seed',
            },
          },
        });
      }
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
    },
    // Hosted databases add per-statement latency to ~350 sequential upserts.
    { timeout: 120000, maxWait: 10000 },
  );
  if (newCredentials.length) {
    // Merge so credentials of accounts created by an earlier run are not lost.
    const file = new URL('../.seed-credentials.json', import.meta.url);
    const previous = await readFile(file, 'utf8')
      .then((text) =>
        z
          .array(z.object({ email: z.string(), password: z.string() }))
          .parse(JSON.parse(text)),
      )
      .catch(() => []);
    const merged = new Map(previous.map((c) => [c.email, c]));
    for (const c of newCredentials) merged.set(c.email, c);
    await writeFile(file, JSON.stringify([...merged.values()], null, 2), {
      mode: 0o600,
    });
    await chmod(file, 0o600);
  }
  console.log(
    'Synthetic seed complete; existing rows preserved. Newly created demo credentials are in apps/api/.seed-credentials.json (private, ignored).',
  );
}
seed()
  .catch((error) => {
    if (error?.code === 'P2002')
      console.error(
        `Seed conflicts with an existing differently identified record (${
          error.meta?.target ??
          error.meta?.driverAdapterError?.cause?.constraint?.index ??
          'unique constraint'
        }); the transaction was rolled back and existing data is unchanged.`,
      );
    else console.error(error instanceof Error ? error.message : 'Seed failed');
    process.exitCode = 1;
  })
  .finally(disconnectPrisma);
