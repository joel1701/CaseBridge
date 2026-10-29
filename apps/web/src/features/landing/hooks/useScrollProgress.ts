import { useEffect, useRef } from 'react';
// Runs a section's scroll-progress update (ported from the reference's upd() functions)
// at most once per animation frame. `resized` is true for the first run, resizes and font loads.
export function useScrollProgress(
  update: (resized: boolean) => void,
  { afterFonts = false }: { afterFonts?: boolean } = {},
) {
  const latest = useRef(update);
  useEffect(() => {
    latest.current = update;
  });
  useEffect(() => {
    let frame = 0;
    let alive = true;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        latest.current(false);
      });
    };
    const onResize = () => latest.current(true);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize);
    latest.current(true);
    if (afterFonts) {
      document.fonts?.ready.then(() => {
        if (alive) latest.current(true);
      });
    }
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onResize);
    };
  }, [afterFonts]);
}
