import { useRef } from 'react';
import { engines } from '../content';
import { Spec } from '@/components/ui/spec';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { EngineVignette } from './vignettes';

// Engines deck: the top card flies off and the rest move up.
// With reduced motion all four cards are a plain list (CSS), so nothing is hidden.
export function Engines({ reduce }: { reduce: boolean }) {
  const secRef = useRef<HTMLElement>(null);
  const last = useRef(-1);

  useScrollProgress((resized) => {
    const sec = secRef.current;
    if (!sec || reduce) return;
    if (resized) last.current = -1;
    const cards = [...sec.querySelectorAll<HTMLElement>('.ecard')];
    const names = [...sec.querySelectorAll<HTMLElement>('.enames li')];
    const r = sec.getBoundingClientRect();
    const d = r.height - innerHeight;
    const q = d > 0 ? Math.min(1, Math.max(0, -r.top / d)) : 0;
    const a = Math.min(cards.length - 1, Math.floor(q * cards.length * 0.999));
    if (a === last.current) return;
    last.current = a;
    cards.forEach((c, i) => {
      const k = i - a;
      if (k < 0) {
        c.style.transform = 'translate(-118%,-4%) rotate(-12deg)';
        c.style.opacity = '0';
        c.style.zIndex = '1';
      } else {
        c.style.transform =
          'translate(' +
          k * 16 +
          'px,' +
          k * 16 +
          'px) rotate(' +
          k * 2.2 +
          'deg) scale(' +
          (1 - k * 0.04) +
          ')';
        c.style.opacity = String(1 - k * 0.18);
        c.style.zIndex = String(20 - k);
      }
    });
    names.forEach((n, i) => n.classList.toggle('on', i === a));
  });

  return (
    <section
      className="engines"
      id="engines"
      data-tone="base"
      data-section="engines"
      ref={secRef}
    >
      <div className="esticky wrap">
        <div className="egrid">
          <div>
            <h2 className="h2">{engines.title}</h2>
            <p className="lead" style={{ marginTop: 18 }}>
              {engines.lead}
            </p>
            <ol className="enames" id="enames">
              {engines.items.map((e, i) => (
                <li key={e.name} className={i === 0 ? 'on' : undefined}>
                  {e.name}
                </li>
              ))}
            </ol>
          </div>
          <div className="deck" id="deck">
            {engines.items.map((e) => (
              <article key={e.name} className="ecard">
                <div>
                  <h3 className="ename">{e.name}</h3>
                  <p className="wide">{e.subtitle}</p>
                </div>
                <figure className="efig">
                  <EngineVignette figure={e.figure} />
                </figure>
                <Spec items={e.spec} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
