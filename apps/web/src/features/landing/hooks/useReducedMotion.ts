import { useState } from 'react';
// Read once on mount, as the reference does, so first render already has the right layout.
export function useReducedMotion() {
  const [reduce] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  return reduce;
}
