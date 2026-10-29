import { useRef } from 'react';
import { desks } from '../content';
import { useScrollProgress } from '../hooks/useScrollProgress';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const io = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function Check() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

// Two desks: apart, slide together while the reasons tick in, link, then alert.
export function TwoDesks({ reduce }: { reduce: boolean }) {
  const secRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const lRef = useRef<HTMLElement>(null);
  const rRef = useRef<HTMLElement>(null);
  const belowRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const nodeRef = useRef<SVGCircleElement>(null);

  useScrollProgress(
    () => {
      const sec = secRef.current;
      const board = boardRef.current;
      const L = lRef.current;
      const Rc = rRef.current;
      const below = belowRef.current;
      const alertc = alertRef.current;
      const svg = svgRef.current;
      const path = pathRef.current;
      const node = nodeRef.current;
      if (
        !sec ||
        !board ||
        !L ||
        !Rc ||
        !below ||
        !alertc ||
        !svg ||
        !path ||
        !node
      )
        return;
      const steps = [...sec.querySelectorAll<HTMLElement>('.dstep')];
      const reasons = [...sec.querySelectorAll<HTMLElement>('.reason')];
      const r = sec.getBoundingClientRect();
      const d = r.height - innerHeight;
      const q = reduce ? 1 : d > 0 ? clamp(-r.top / d, 0, 1) : 0;
      const st = q < 0.28 ? 0 : q < 0.7 ? 1 : 2;
      steps.forEach((s, i) => {
        s.classList.toggle('on', i === st);
        s.classList.toggle('past', i < st);
      });
      const bw = board.clientWidth;
      const cw = L.offsetWidth;
      const gap = 48;
      const travel =
        Math.max(0, (bw - 2 * cw - gap) / 2) *
        io(clamp((q - 0.28) / 0.24, 0, 1));
      L.style.transform = 'translateX(' + travel + 'px)';
      Rc.style.transform = 'translateX(' + -travel + 'px)';
      const ch = Math.max(L.offsetHeight, Rc.offsetHeight);
      below.style.top = ch + 32 + 'px';
      reasons.forEach((x, i) => x.classList.toggle('on', q > 0.36 + i * 0.06));
      const matched = q > 0.36;
      L.classList.toggle('matched', matched);
      Rc.classList.toggle('matched', matched);
      svg.setAttribute('viewBox', '0 0 ' + bw + ' ' + board.clientHeight);
      const y = Math.min(L.offsetHeight, Rc.offsetHeight) / 2;
      const x1 = cw + travel;
      const x2 = bw - cw - travel;
      path.setAttribute('d', 'M' + x1 + ' ' + y + ' H' + x2);
      const k = clamp((q - 0.56) / 0.1, 0, 1);
      const len = Math.max(1, x2 - x1);
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len * (1 - k));
      node.setAttribute('cx', String((x1 + x2) / 2));
      node.setAttribute('cy', String(y));
      node.setAttribute('opacity', k >= 1 ? '1' : '0');
      const al = q >= 0.7;
      const col = al ? '#FF5C6C' : '#9AA4FF';
      node.setAttribute('stroke', col);
      path.setAttribute('stroke', col);
      alertc.classList.toggle('on', al);
      below.classList.toggle('alerting', al);
    },
    { afterFonts: true },
  );

  return (
    <section
      className="desks"
      id="desks"
      data-tone="base"
      data-section="desks"
      ref={secRef}
    >
      <div className="dsticky wrap">
        <div className="dgrid">
          <div className="dsteps">
            {desks.steps.map((s, i) => (
              <div key={s.title} className={i === 0 ? 'dstep on' : 'dstep'}>
                <h2 className="h2">{s.title}</h2>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
          <div className="board" id="board" ref={boardRef}>
            <svg className="dlink" id="dlink" aria-hidden="true" ref={svgRef}>
              <path
                id="dpath"
                ref={pathRef}
                fill="none"
                stroke="#9AA4FF"
                strokeWidth="2"
              />
              <circle
                id="dnode"
                ref={nodeRef}
                r="7"
                fill="#0B0E14"
                stroke="#9AA4FF"
                strokeWidth="2"
                opacity="0"
              />
            </svg>
            {desks.cases.map((c) => (
              <article
                key={c.ref}
                className={c.side === 'l' ? 'case lcase' : 'case rcase'}
                id={c.side === 'l' ? 'lcase' : 'rcase'}
                ref={c.side === 'l' ? lRef : rRef}
              >
                <span className="bu">{c.bureau}</span>
                <h3>{c.name}</h3>
                <p>
                  {c.ref} · <b>{c.category}</b>
                </p>
                <p className="idl">{c.permanentId}</p>
              </article>
            ))}
            <div className="below" id="below" ref={belowRef}>
              <div className="reasons">
                {desks.reasons.map((r) => (
                  <span key={r} className="reason">
                    <Check />
                    {r}
                  </span>
                ))}
              </div>
              <div className="alertc" id="alertc" role="status" ref={alertRef}>
                <strong>{desks.alert.title}</strong>
                <p className="anote">{desks.alert.text}</p>
                <div className="acts">
                  {desks.alert.actions.map((a) => (
                    <span key={a}>{a}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
