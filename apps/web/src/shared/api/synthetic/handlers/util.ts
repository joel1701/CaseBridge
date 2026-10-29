import { ApiError } from '../../request';
import type { PageMeta, PageQuery } from '../../../types';

type Detail = { path: (string | number)[]; message: string };

export function invalid(details: Detail[]): never {
  throw new ApiError(
    400,
    'VALIDATION_ERROR',
    'Request validation failed',
    details,
  );
}
export function notFound(what = 'Resource'): never {
  throw new ApiError(404, 'NOT_FOUND', `${what} not found`);
}
export function conflict(code: string, message: string): never {
  throw new ApiError(409, code, message);
}

/** Same paging rules as the API: page >= 1, pageSize 1..100, default 20. */
export function paginate<T>(
  all: T[],
  q: PageQuery = {},
): { items: T[]; meta: PageMeta } {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 20;
  const errs: Detail[] = [];
  if (!Number.isInteger(page) || page < 1)
    errs.push({ path: ['page'], message: 'Must be at least 1' });
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
    errs.push({ path: ['pageSize'], message: 'Must be between 1 and 100' });
  if (errs.length) invalid(errs);
  return {
    items: all.slice((page - 1) * pageSize, page * pageSize),
    meta: { page, pageSize, total: all.length },
  };
}

/** Trimmed text required within min..max characters, as the API's zod schemas. */
export function text(
  errs: Detail[],
  field: string,
  value: unknown,
  max: number,
  required = true,
) {
  if (value === undefined && !required) return;
  if (typeof value !== 'string' || value.trim().length < 1)
    errs.push({ path: [field], message: 'Required' });
  else if (value.trim().length > max)
    errs.push({ path: [field], message: `Must be at most ${max} characters` });
}
export const reasonField = (errs: Detail[], field: string, value: unknown) =>
  text(errs, field, value, 2000);
export function done(errs: Detail[]) {
  if (errs.length) invalid(errs);
}
