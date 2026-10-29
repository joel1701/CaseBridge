import { useEffect, type RefObject } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../motion';
// Smooth scrolling for the landing route only, driven by GSAP's ticker as in the reference.
export function useLenis(
  enabled: boolean,
  root: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const el = root.current;
    if (!enabled || !el) return;
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest('a[href^="#"]');
      const href = a?.getAttribute('href');
      const target = href && href.length > 1 && document.querySelector(href);
      if (target instanceof HTMLElement) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0 });
      }
    };
    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('click', onClick);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      // destroy() cleans up, but a state setter that fires after it (e.g. when the
      // route changes mid-scroll) can put the class back on <html>; strip it again.
      const strip = () => {
        const html = document.documentElement;
        html.className = html.className.replace(/\blenis(-\w+)?\b/g, '').trim();
      };
      strip();
      requestAnimationFrame(strip);
    };
  }, [enabled, root]);
}
