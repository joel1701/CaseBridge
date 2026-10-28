import { z } from 'zod';
import { idSchema } from '../case-links/access.js';
export const coordinationSchema = z.strictObject({
  caseLinkId: idSchema,
  type: z.enum([
    'SHARE_EVIDENCE',
    'JOINT_INVESTIGATION',
    'DEFER_ACTION',
    'KEEP_SEPARATE',
  ]),
  rationale: z.string().trim().min(1).max(2000),
});
export type CoordinationInput = z.infer<typeof coordinationSchema>;
