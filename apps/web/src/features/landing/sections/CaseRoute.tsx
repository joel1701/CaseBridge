import { useRef } from 'react';
import { gsap, useGSAP } from '../motion';
import { route } from '../content';

// Life of a case: a pinned sideways route that steps from day to day,
// marking each one as reached.
export function CaseRoute({ reduce }: { reduce: boolean }) {
  const secRef = useRef<HTMLElement>(null);
  const rpinRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const rsvgRef = useRef<SVGSVGElement>(null);
  const rpathRef = useRef<SVGPathElement>(null);
  const rdrawRef = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      if (reduce) return;
      const rail = railRef.current!;
      const rpin = rpinRef.current!;
      const rsvg = rsvgRef.current!;
      const rpath = rpathRef.current!;
      const rdraw = rdrawRef.current!;
      const stops = gsap.utils.toArray<HTMLElement>('.stop');
      rpin.classList.add('pinned');
      let len = 0;
      let pts: [number, number][] = [];
      function buildRoute() {
        const x0 = gsap.getProperty(rail, 'x');
        gsap.set(rail, { x: 0 });
        const rb = rail.getBoundingClientRect();
        pts = [...rail.querySelectorAll('.sday i')].map((i) => {
          const b = i.getBoundingClientRect();
          return [
            b.left - rb.left + b.width / 2,
            b.top - rb.top + b.height / 2,
          ];
        });
        gsap.set(rail, { x: x0 });
        if (!pts.length) return;
        let d = 'M' + pts[0][0] + ' ' + pts[0][1];
        for (let k = 1; k < pts.length; k++) {
          const [a, b] = pts[k - 1];
          const [c, e] = pts[k];
          const mx = (a + c) / 2;
          d += ' C' + mx + ' ' + b + ' ' + mx + ' ' + e + ' ' + c + ' ' + e;
        }
        rsvg.setAttribute(
          'viewBox',
          '0 0 ' + rail.scrollWidth + ' ' + rail.scrollHeight,
        );
        rsvg.style.width = rail.scrollWidth + 'px';
        rpath.setAttribute('d', d);
        rdraw.setAttribute('d', d);
        len = rdraw.getTotalLength();
        rdraw.style.strokeDasharray = String(len);
      }
      buildRoute();
      const maxX = () => Math.max(0, rail.scrollWidth - innerWidth);
      const xFor = (i: number) => {
        const st = stops[i];
        return -Math.min(
          maxX(),
          Math.max(0, st.offsetLeft + st.offsetWidth / 2 - innerWidth * 0.42),
        );
      };
      const rtl = gsap.timeline({
        scrollTrigger: {
          trigger: rpin,
          start: 'top top',
          end: () => '+=' + stops.length * innerHeight * 0.38,
          pin: true,
          scrub: 0.4,
          invalidateOnRefresh: true,
          snap: {
            snapTo: 'labels',
            duration: { min: 0.12, max: 0.3 },
            delay: 0.04,
            ease: 'power2.inOut',
          },
          onRefresh: buildRoute,
        },
      });
      stops.forEach((_st, i) => {
        if (i > 0)
          rtl.to(rail, { x: () => xFor(i), duration: 1, ease: 'power1.inOut' });
        rtl.addLabel('s' + i);
        rtl.to({}, { duration: 0.55 });
      });
      rtl.eventCallback('onUpdate', () => {
        const t = rtl.time();
        let a = 0;
        stops.forEach((_s, i) => {
          if (rtl.labels['s' + i] <= t + 0.001) a = i;
        });
        stops.forEach((s, i) => {
          s.classList.toggle('on', i === a);
          s.classList.toggle('done', i < a);
        });
        if (pts.length > 1 && len) {
          const cx =
            -(gsap.getProperty(rail, 'x') as number) + innerWidth * 0.42;
          const f = Math.min(
            1,
            Math.max(
              0,
              (cx - pts[0][0]) / (pts[pts.length - 1][0] - pts[0][0]),
            ),
          );
          rdraw.style.strokeDashoffset = String(len * (1 - f));
        }
      });
      stops[0].classList.add('on');
      rdraw.style.strokeDashoffset = String(len);
      return () => {
        rpin.classList.remove('pinned');
        stops.forEach((s) => s.classList.remove('on', 'done'));
      };
    },
    { scope: secRef, dependencies: [reduce] },
  );

  return (
    <section
      className="route"
      id="route"
      data-tone="indigo"
      data-section="route"
      ref={secRef}
    >
      <div className="wrap rhead">
        <h2 className="h2">{route.title}</h2>
        <p className="lead">{route.lead}</p>
      </div>
      {/* Stable wrapper so ScrollTrigger's pin-spacer never sits between React siblings. */}
      <div className="rpin-wrap">
        <div className="rpin" id="rpin" ref={rpinRef}>
          <div className="rail" id="rail" ref={railRef}>
            <svg className="rsvg" id="rsvg" aria-hidden="true" ref={rsvgRef}>
              <path
                id="rpath"
                ref={rpathRef}
                fill="none"
                stroke="rgba(11,14,20,.35)"
                strokeWidth="2"
                strokeDasharray="6 7"
              />
              <path
                id="rdraw"
                ref={rdrawRef}
                fill="none"
                stroke="#0B0E14"
                strokeWidth="3"
              />
            </svg>
            <ol>
              {route.stops.map((s) => (
                <li
                  key={s.day}
                  className={
                    'stop' + (s.low ? ' stop--low' : '') + (s.hit ? ' hit' : '')
                  }
                >
                  <p className="sday">
                    <i />
                    <span className="dlabel">{s.day}</span>
                    <em>{route.reached}</em>
                  </p>
                  <div className="sfig">{s.fig}</div>
                  <h3 className="stitle">{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
