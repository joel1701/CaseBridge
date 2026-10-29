import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

type Patch<T> = Partial<Record<keyof T, string | undefined>>;

// Page state in the URL (?q=&status=&page=…). Values equal to their default are left
// out of the URL. Writes start from the live URL rather than the last render, so two
// quick changes never undo each other. Changing anything but `page` resets `page`.
export function useUrlState<T extends Record<string, string>>(defaultsArg: T) {
  const [params, setParams] = useSearchParams();
  // Callers pass an object literal; key the memo on its contents, not its identity.
  const key = JSON.stringify(defaultsArg);
  const defaults = useMemo(() => JSON.parse(key) as T, [key]);

  const state = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(defaults).map(([k, d]) => [k, params.get(k) ?? d]),
      ) as T,
    [params, defaults],
  );

  const set = useCallback(
    (patch: Patch<T>) => {
      const next = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '' || v === defaults[k]) next.delete(k);
        else next.set(k, v);
      }
      if ('page' in defaults && !('page' in patch)) next.delete('page');
      setParams(next, { replace: true });
    },
    [setParams, defaults],
  );

  return [state, set] as const;
}
