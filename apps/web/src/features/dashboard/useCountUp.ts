import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

// Counts up once, the first time a value arrives; later changes (filters) show directly.
// The ease-out curve approximates the brief's --ease, cubic-bezier(.2,.7,.1,1).
export function useCountUp(target: number, duration = 700) {
  const reduce = useReducedMotion();
  const [finished, setFinished] = useState(false);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (finished || reduce) return;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      // rAF's timestamp is the frame start, which can precede `start`; clamp so it never goes below 0.
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      setShown(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
      else setFinished(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduce, finished]);

  return finished || reduce ? target : shown;
}
