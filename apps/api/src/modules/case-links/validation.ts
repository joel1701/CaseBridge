import { z } from 'zod';
export const reviewSchema = z.strictObject({
  status: z.enum(['CONFIRMED', 'REJECTED']),
  reason: z.string().trim().min(1).max(2000),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
