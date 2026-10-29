import { isAxiosError } from 'axios';
import { useMocks } from './client';
import type { ApiSuccess, PageMeta, Paged, Scoped } from '../types';

// One switch for every area: synthetic data in mock mode, or when an endpoint
// doesn't exist yet; otherwise the real API. A response is never a mix of both.

/** Thrown by the synthetic handlers with the API's exact status and codes. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { path: (string | number)[]; message: string }[],
  ) {
    super(message);
  }
}

// The API answers an unknown route with 404 NOT_FOUND "Route not found" (app.ts),
// the same code as a missing record. Only that message, or a 501, means "not built".
export function isMissingEndpoint(err: unknown): boolean {
  if (!isAxiosError(err) || !err.response) return false;
  if (err.response.status === 501) return true;
  const body = err.response.data as
    { error?: { message?: string } } | undefined;
  return (
    err.response.status === 404 && body?.error?.message === 'Route not found'
  );
}

/** Simulated latency so loading states are visible in mock mode. */
const latency = (ms = 250) => new Promise((r) => setTimeout(r, ms));

async function choose<T>(real: () => Promise<T>, mock: () => T | Promise<T>) {
  if (useMocks) {
    await latency();
    return { value: await mock(), scope: 'SYNTHETIC' as const };
  }
  try {
    return { value: await real(), scope: 'AUTHORIZED' as const };
  } catch (err) {
    if (isMissingEndpoint(err))
      return { value: await mock(), scope: 'SYNTHETIC' as const };
    throw err;
  }
}

/** A single-record endpoint: unwraps `{ success, data }`. */
export async function callOne<T>(
  real: () => Promise<{ data: ApiSuccess<T> }>,
  mock: () => T | Promise<T>,
): Promise<Scoped<T>> {
  const { value, scope } = await choose(
    async () => (await real()).data.data,
    mock,
  );
  return { data: value, scope };
}

/** A list endpoint: `data.items` plus top-level `meta`. */
export async function callPage<T>(
  real: () => Promise<{ data: ApiSuccess<{ items: T[] }> }>,
  mock: () =>
    { items: T[]; meta: PageMeta } | Promise<{ items: T[]; meta: PageMeta }>,
): Promise<Paged<T>> {
  const { value, scope } = await choose(async () => {
    const res = (await real()).data;
    return {
      items: res.data.items,
      meta: res.meta ?? {
        page: 1,
        pageSize: res.data.items.length,
        total: res.data.items.length,
      },
    };
  }, mock);
  return { ...value, scope };
}

/** Drops undefined values so query strings only carry what was set. */
export function params<T extends object>(q: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(q).filter(([, v]) => v !== undefined && v !== ''),
  ) as Partial<T>;
}
