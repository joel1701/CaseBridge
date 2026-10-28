export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
/** Lock timeouts (P2010/55P03), pool waits and connection loss become a retryable 503, matching the intelligence lock helper. */
export function asDependencyError(error: unknown): unknown {
  if (error instanceof AppError) return error;
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : undefined;
  return code &&
    ['P2028', 'P2034', 'P2010', 'P1001', 'P1002', 'P1017'].includes(code)
    ? new AppError(
        503,
        'DEPENDENCY_UNAVAILABLE',
        'Database busy or unavailable; retry the request',
      )
    : error;
}
