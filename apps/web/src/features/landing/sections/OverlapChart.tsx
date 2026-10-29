import { useRef, type CSSProperties } from 'react';
import { gsap, useGSAP } from '../motion';
import { chart } from '../content';

const max = Math.max(...chart.bars.map((b) => b.value));
const heights = chart.bars.map((b) => Math.round((b.value / max) * 100));
if (import.meta.env.DEV) {
  // The reference's hand-written bar heights; content changes should keep this formula.
  const reference = [21, 32, 50, 43, 64, 75, 100, 86, 68, 57];
  if (heights.join() !== reference.join())
    console.warn('Chart heights differ from the reference', heights);
}

export function OverlapChart({ reduce }: { reduce: boolean }) {
  const barsRef = useRef<HTMLOListElement>(null);

  // Bars grow from the baseline.
  useGSAP(
    () => {
      if (reduce) return;
      gsap.from('.bcol', {
        scaleY: 0,
        duration: 1.1,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: barsRef.current, start: 'top 80%' },
      });
    },
    { scope: barsRef, dependencies: [reduce] },
  );

  return (
    <section
      className="chart-sec wrap"
      id="chart"
      data-tone="paper"
      data-section="chart"
    >
      <div className="cgrid">
        <div>
          <h2 className="h2">{chart.title}</h2>
          <p className="lead" style={{ marginTop: 20 }}>
            {chart.lead}
          </p>
        </div>
        <figure>
          <ol className="bars" id="bars" aria-label={chart.label} ref={barsRef}>
            {chart.bars.map((b, i) => (
              <li
                key={b.month}
                className={b.value === max ? 'bar peak' : 'bar'}
              >
                <span className="bv">{b.value}</span>
                <span
                  className="bcol"
                  style={{ '--h': heights[i] + '%' } as CSSProperties}
                />
                <span className="bm">{b.month}</span>
              </li>
            ))}
          </ol>
          <figcaption className="cnote">{chart.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
