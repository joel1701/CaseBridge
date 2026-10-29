import { useSyncExternalStore } from 'react';
const query = '(prefers-reduced-motion: reduce)';
// Live prefers-reduced-motion for app pages (the landing page reads it once, by design).
export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
