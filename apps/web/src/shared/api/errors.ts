import { isAxiosError } from 'axios';
import type { ApiFailure } from '../types';
import { ApiError } from './request';

// Maps any failure (real API, synthetic handler, network) to the API's error code,
// and the code to a calm sentence with one next step.

export function apiErrorCode(err: unknown): string {
  if (err instanceof ApiError) return err.code;
  if (
    err instanceof Error &&
    'code' in err &&
    typeof err.code === 'string' &&
    !isAxiosError(err)
  )
    return err.code; // AuthError and similar
  if (isAxiosError<ApiFailure>(err)) {
    if (!err.response) return 'NETWORK';
    const code = err.response.data?.error?.code;
    if (code) return code;
    return err.response.status === 409 ? 'CONFLICT' : 'UNKNOWN';
  }
  return 'UNKNOWN';
}

const STALE = new Set([
  'STALE_REVIEW',
  'STALE_COMPLAINT',
  'STALE_COORDINATION',
  'CASE_CHANGED',
  'CONFLICT',
]);
/** 409s that mean "someone else changed this first". */
export const isStale = (code: string) => STALE.has(code);

const messages: Record<string, string> = {
  VALIDATION_ERROR:
    'Some details need attention. Check the highlighted fields and try again.',
  INVALID_JSON:
    'Some details need attention. Check the highlighted fields and try again.',
  NOT_FOUND: "This record doesn't exist, or it isn't in your bureau's scope.",
  STALE:
    'Someone changed this case while you were working. Reload to see their change.',
  REVIEW_REQUIRED:
    'Another bureau has related work on this case. Add a reason to go ahead, or coordinate first.',
  DUPLICATE_REFERENCE:
    'A case with this reference already exists in that bureau.',
  INVALID_STATE: "This case isn't in a state that allows that change.",
  RELATIONSHIP_DEPENDENCY:
    'This case is part of a linked relationship. Resolve the link first.',
  COORDINATION_DEPENDENCY:
    'An open coordination workspace depends on this case. Close it first.',
  RATE_LIMITED: 'Too many attempts. Try again in 15 minutes.',
  FORBIDDEN: "Your role can't make this change. Ask your bureau head.",
  UNAUTHENTICATED: 'Your session has ended. Sign in again to continue.',
  UNTRUSTED_ORIGIN:
    "This request didn't come from Setu. Reload the page and try again.",
  DEPENDENCY_UNAVAILABLE: 'The service is busy. Try again in a moment.',
  DATABASE_NOT_CONFIGURED:
    "Setu's database isn't available right now. Try again later.",
  AI_UNAVAILABLE:
    'Matching is unavailable right now. You can still review the case by hand.',
  PAYLOAD_TOO_LARGE: 'That upload is too large. Split it into smaller files.',
  NETWORK: "Can't reach Setu right now. Check your connection and try again.",
};

export function apiErrorMessage(codeOrError: unknown): string {
  const code =
    typeof codeOrError === 'string' ? codeOrError : apiErrorCode(codeOrError);
  if (isStale(code)) return messages.STALE;
  return messages[code] ?? 'Something went wrong. Try again.';
}

/** Field errors from a VALIDATION_ERROR's `details`, keyed by the first path segment. */
export function fieldErrors(err: unknown): Record<string, string> {
  const details =
    err instanceof ApiError
      ? err.details
      : isAxiosError<ApiFailure>(err)
        ? (err.response?.data?.error?.details as ApiError['details'])
        : undefined;
  if (!Array.isArray(details)) return {};
  return Object.fromEntries(
    details.map((d) => [String(d.path[0] ?? 'form'), d.message]),
  );
}
