import { useRef } from 'react';
import { Link } from 'react-router';
import { gsap, useGSAP } from '../motion';
import { close } from '../content';
import { Spec } from '@/components/ui/spec';

export function Close({ reduce }: { reduce: boolean }) {
  const secRef = useRef<HTMLElement>(null);

  // The closing word rises.
  useGSAP(
    () => {
      if (reduce) return;
      gsap.from('.cword', {
        yPercent: 40,
        ease: 'none',
        scrollTrigger: {
          trigger: secRef.current,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
        },
      });
    },
    { scope: secRef, dependencies: [reduce] },
  );

  return (
    <section
      className="close wrap"
      id="close"
      data-tone="base"
      data-section="close"
      ref={secRef}
    >
      <div className="crow">
        <Spec items={close.spec} />
        <div className="btns">
          <Link className="btn" to="/login">
            Sign in
          </Link>
          <a className="btn btn--ghost" href={close.explore.href}>
            {close.explore.label}
          </a>
        </div>
      </div>
      <p className="cword" aria-hidden="true">
        {close.word}
      </p>
    </section>
  );
}
