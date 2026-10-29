/* Layout and motion system adapted from: Wayfind AI Travel Companion Page · INSTALANDING.AI (MIT) · https://instalanding.ai/prompt/wayfind-ai-travel-companion-page */
import { useEffect, useRef } from 'react';
import './landing.css';
import { ScrollTrigger } from './motion';
import { useLenis } from './hooks/useLenis';
import { useReducedMotion } from './hooks/useReducedMotion';
import { SiteNav } from './sections/SiteNav';
import { Hero } from './sections/Hero';
import { Manifesto } from './sections/Manifesto';
import { TwoDesks } from './sections/TwoDesks';
import { Views } from './sections/Views';
import { CaseRoute } from './sections/CaseRoute';
import { Engines } from './sections/Engines';
import { OverlapChart } from './sections/OverlapChart';
import { Roles } from './sections/Roles';
import { Faq } from './sections/Faq';
import { Close } from './sections/Close';
import { Footer } from './sections/Footer';

// Approved design: docs/design/setu-landing.html (brief: docs/SETU_DESIGN.md).
export function LandingPage() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const manifestoRef = useRef<HTMLElement>(null);

  useLenis(!reduce, rootRef);

  // Re-measure every trigger once fonts and images have settled, as the reference does.
  useEffect(() => {
    if (reduce) return;
    let alive = true;
    const refresh = () => {
      if (alive) ScrollTrigger.refresh();
    };
    addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);
    return () => {
      alive = false;
      removeEventListener('load', refresh);
    };
  }, [reduce]);

  return (
    <div
      className="landing"
      ref={rootRef}
      data-motion={reduce ? undefined : ''}
    >
      <SiteNav navRef={navRef} manifestoRef={manifestoRef} />
      <main id="top">
        <Hero navRef={navRef} reduce={reduce} />
        <Manifesto manifestoRef={manifestoRef} />
        <TwoDesks reduce={reduce} />
        <Views reduce={reduce} />
        <CaseRoute reduce={reduce} />
        <Engines reduce={reduce} />
        <OverlapChart reduce={reduce} />
        <Roles reduce={reduce} />
        <Faq />
        <Close reduce={reduce} />
      </main>
      <Footer />
    </div>
  );
}
