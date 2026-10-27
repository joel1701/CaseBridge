import { z } from 'zod';
import { idSchema } from '../case-links/access.js';
const fields = {
  complaintId: idSchema,
  type: z.enum(['EVIDENCE_REQUEST', 'INSPECTION', 'NOTICE', 'REVIEW']),
  summary: z.string().trim().min(1).max(2000),
  evidenceScope: z.string().trim().min(1).max(200).optional(),
  dueAt: z.iso.datetime({ offset: true }).optional(),
};
const scopeRequired = (value: { type: string; evidenceScope?: string }) =>
  value.type !== 'EVIDENCE_REQUEST' || Boolean(value.evidenceScope?.trim());
export const previewSchema = z.strictObject(fields).refine(scopeRequired, {
  path: ['evidenceScope'],
  message: 'Evidence requests require an explicit evidence scope',
});
export const createActionSchema = z
  .strictObject({
    ...fields,
    overrideReason: z.string().trim().min(1).max(2000).optional(),
  })
  .refine(scopeRequired, {
    path: ['evidenceScope'],
    message: 'Evidence requests require an explicit evidence scope',
  });
export type ProposedAction = z.infer<typeof previewSchema>;
export type CreateAction = z.infer<typeof createActionSchema>;
