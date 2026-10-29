import { useRef, type CSSProperties } from 'react';
import { gsap, useGSAP } from '../motion';
import { views } from '../content';
import { Spec } from '@/components/ui/spec';
import { ViewVignette } from './vignettes';

// Stacked posters: each one shrinks, tilts and darkens as the next slides over it.
export function Views({ reduce }: { reduce: boolean }) {
  const stackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reduce) return;
      const posters = gsap.utils.toArray<HTMLElement>('.poster');
      posters.forEach((p, i) => {
        const next = posters[i + 1];
        if (!next) return;
        gsap.to(p, {
          scale: 0.93,
          rotate: i % 2 ? 1.6 : -1.6,
          '--dim': 0.55,
          ease: 'none',
          scrollTrigger: {
            trigger: next,
            start: 'top bottom',
            end: 'top top+=120',
            scrub: true,
          },
        });
      });
    },
    { scope: stackRef, dependencies: [reduce] },
  );

  return (
    <section className="views" id="views" data-tone="base" data-section="views">
      <div className="wrap vhead">
        <h2 className="h2">{views.title}</h2>
        <p className="lead">{views.lead}</p>
      </div>
      <div className="stack" id="stack" ref={stackRef}>
        {views.items.map((v, i) => (
          <article
            key={v.title}
            className="poster"
            style={{ '--i': i } as CSSProperties}
          >
            <div className="pcol">
              <Spec items={v.spec} />
              <h3 className="ptitle">{v.title}</h3>
              <div className="ptext">
                <p>{v.text}</p>
                <a className="link" href={v.link.href}>
                  {v.link.label}
                </a>
              </div>
            </div>
            <figure className="pfig">
              <ViewVignette data={v.figure} />
            </figure>
          </article>
        ))}
      </div>
    </section>
  );
}
