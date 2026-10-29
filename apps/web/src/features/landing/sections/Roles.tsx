import { useRef } from 'react';
import { roles } from '../content';
import { Spec } from '@/components/ui/spec';
import { useScrollProgress } from '../hooks/useScrollProgress';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

// Roles: three cards dealt from a stack.
export function Roles({ reduce }: { reduce: boolean }) {
  const secRef = useRef<HTMLElement>(null);

  useScrollProgress(() => {
    const sec = secRef.current;
    if (!sec) return;
    const cards = [...sec.querySelectorAll<HTMLElement>('.role')];
    if (innerWidth <= 860 || reduce) {
      cards.forEach((c) => {
        c.style.transform = '';
      });
      return;
    }
    const r = sec.getBoundingClientRect();
    const d = r.height - innerHeight;
    const q = d > 0 ? clamp(-r.top / d, 0, 1) : 0;
    const e = ease(clamp(q / 0.55, 0, 1));
    const mid = cards[1].getBoundingClientRect();
    const mc = mid.left + mid.width / 2;
    cards.forEach((c, i) => {
      const b = c.getBoundingClientRect();
      const cur = new DOMMatrixReadOnly(getComputedStyle(c).transform).m41;
      const cx = b.left - cur + b.width / 2;
      const dx = (mc - cx) * (1 - e);
      const rot = [-9, 0, 9][i] * (1 - e) + [-1.2, 0, 1.2][i] * e;
      const dy = i === 1 ? -14 * e : 18 * (1 - e);
      c.style.transform =
        'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg)';
      c.style.zIndex = i === 1 ? '3' : '1';
    });
  });

  return (
    <section
      className="roles"
      id="roles"
      data-tone="base"
      data-section="roles"
      ref={secRef}
    >
      <div className="rsticky wrap">
        <h2 className="h2">{roles.title}</h2>
        <ul className="rgrid">
          {roles.items.map((r) => (
            <li key={r.name} className={r.main ? 'role role--main' : 'role'}>
              <h3 className="rname">{r.name}</h3>
              <Spec items={r.spec} />
              <ul>
                {r.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
