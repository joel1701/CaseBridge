import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import {
  idSchema,
  paginationSchema,
  parseInput,
} from '../case-links/access.js';
import { AppError } from '../../lib/errors.js';
export const statusSchema = z.enum([
  'RECEIVED',
  'UNDER_PROCESS',
  'TRANSFERRED',
  'ESCALATED',
  'DISPOSED',
]);
const text = (max: number) => z.string().trim().min(1).max(max);
export const createSchema = z.strictObject({
  originalId: text(100),
  institutionId: idSchema,
  bureauId: idSchema,
  title: text(200),
  description: text(10000),
  category: text(64),
  dueAt: z.iso.datetime().nullable().optional(),
});
export const listSchema = paginationSchema.extend({
  status: statusSchema.optional(),
  institutionId: idSchema.optional(),
  bureauId: idSchema.optional(),
  category: text(64).optional(),
  assignedToId: idSchema.optional(),
  q: text(200).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'dueAt', 'title'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  archived: z.enum(['true', 'false']).default('false'),
});
export const changeSchema = z
  .strictObject({
    expectedVersion: z.number().int().nonnegative(),
    reason: text(2000),
    title: text(200).optional(),
    description: text(10000).optional(),
    category: text(64).optional(),
    dueAt: z.iso.datetime().nullable().optional(),
    institutionId: idSchema.optional(),
    assignedToId: idSchema.nullable().optional(),
    status: statusSchema.optional(),
    bureauId: idSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 2, 'Supply at least one change');
export const archiveSchema = z.strictObject({
  expectedVersion: z.number().int().nonnegative(),
  reason: text(2000),
});
export const importSchema = z.strictObject({
  items: z.array(createSchema).min(1).max(100),
});
export const csvSchema = z.strictObject({ csv: z.string().min(1).max(900000) });
export function parseCsv(input: unknown) {
  const { csv } = parseInput(csvSchema, input);
  let rows: unknown;
  try {
    rows = parse(csv, {
      bom: true,
      columns: (headers: string[]) => {
        const expected = [
          'originalId',
          'institutionId',
          'bureauId',
          'title',
          'description',
          'category',
          'dueAt',
        ];
        if (
          new Set(headers).size !== headers.length ||
          headers.some((h) => !expected.includes(h)) ||
          expected.slice(0, 6).some((h) => !headers.includes(h))
        )
          throw new Error('Invalid columns');
        return headers;
      },
      skip_empty_lines: true,
      max_record_size: 20000,
      cast: (value, context) =>
        !context.header && context.column === 'dueAt' && value === ''
          ? null
          : value,
    });
  } catch {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Invalid CSV; supply unique documented column names and consistent rows',
    );
  }
  return parseInput(importSchema, { items: rows }).items;
}
export type CreateComplaint = z.infer<typeof createSchema>;
export type ComplaintChanges = z.infer<typeof changeSchema>;
