import { useEffect, useRef, type RefObject } from 'react';
import { Link } from 'react-router';
import { gsap, useGSAP } from '../motion';
import { hero } from '../content';
import { HeroScene } from '../scene/HeroScene';

// The dashboard seen through सेतु, opening to full bleed.
export function Hero({
  navRef,
  reduce,
}: {
  navRef: RefObject<HTMLElement | null>;
  reduce: boolean;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<SVGSVGElement>(null);
  const wordRef = useRef<SVGTextElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);

  // Size the knockout word to the hero: measure the real ink of सेतु on a canvas,
  // then fit and centre it, and put the zoom origin inside the letters.
  useEffect(() => {
    const heroEl = heroRef.current;
    const mask = maskRef.current;
    const kw = wordRef.current;
    if (!heroEl || !mask || !kw) return;
    let alive = true;
    function fitWord() {
      if (!heroEl || !mask || !kw) return;
      const W = heroEl.clientWidth;
      const H = heroEl.clientHeight;
      mask.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const top = navRef.current?.offsetHeight || 80;
      const fs0 = 200;
      const cw = 1400;
      const chh = 700;
      const bl = 520;
      let ink: {
        w: number;
        h: number;
        cx: number;
        top: number;
        bot: number;
        barY: number;
        barX: number;
      } | null = null;
      try {
        const c = document.createElement('canvas');
        c.width = cw;
        c.height = chh;
        const x = c.getContext('2d', { willReadFrequently: true });
        if (x) {
          x.font = '600 ' + fs0 + 'px Teko, "Noto Sans Devanagari", sans-serif';
          x.textAlign = 'center';
          x.textBaseline = 'alphabetic';
          x.fillText('सेतु', cw / 2, bl);
          const d = x.getImageData(0, 0, cw, chh).data;
          let x0 = cw;
          let x1 = 0;
          let y0 = chh;
          let y1 = 0;
          let bestY = 0;
          let bestN = 0;
          for (let yy = 0; yy < chh; yy++) {
            let n = 0;
            for (let xx = 0; xx < cw; xx++) {
              if (d[(yy * cw + xx) * 4 + 3] > 128) {
                n++;
                if (xx < x0) x0 = xx;
                if (xx > x1) x1 = xx;
              }
            }
            if (n) {
              if (yy < y0) y0 = yy;
              y1 = yy;
            }
            if (n > bestN) {
              bestN = n;
              bestY = yy;
            }
          }
          let bx = cw / 2;
          let best = 1e9;
          for (let xx = 0; xx < cw; xx++) {
            if (
              d[(bestY * cw + xx) * 4 + 3] > 128 &&
              Math.abs(xx - cw / 2) < best
            ) {
              best = Math.abs(xx - cw / 2);
              bx = xx;
            }
          }
          if (x1 > x0 && y1 > y0)
            ink = {
              w: x1 - x0,
              h: y1 - y0,
              cx: (x0 + x1) / 2 - cw / 2,
              top: y0 - bl,
              bot: y1 - bl,
              barY: bestY - bl,
              barX: bx - cw / 2,
            };
        }
      } catch {
        ink = null;
      }
      if (ink) {
        const k = Math.min((W * 0.88) / ink.w, ((H - top) * 0.88) / ink.h);
        const fs = fs0 * k;
        const mid = top + (H - top) * 0.5;
        const base = mid - ((ink.top + ink.bot) / 2) * k;
        kw.setAttribute('font-size', String(fs));
        kw.setAttribute('x', String(W / 2 - ink.cx * k));
        kw.setAttribute('y', String(base));
        mask.style.transformOrigin =
          W / 2 +
          (ink.barX - ink.cx) * k +
          'px ' +
          (base + ink.barY * k) +
          'px';
      } else {
        kw.setAttribute('font-size', String(W * 0.3));
        kw.setAttribute('y', String(H * 0.7));
      }
    }
    fitWord();
    document.fonts?.ready.then(() => {
      if (alive) fitWord();
    });
    addEventListener('resize', fitWord);
    return () => {
      alive = false;
      removeEventListener('resize', fitWord);
    };
  }, [navRef]);

  // Hero: the word opens to full bleed.
  useGSAP(
    () => {
      if (reduce) return;
      const heroEl = heroRef.current!;
      const head = navRef.current;
      gsap
        .timeline({
          scrollTrigger: {
            trigger: heroEl,
            start: 'top top',
            end: '+=140%',
            pin: true,
            scrub: 1,
            onUpdate: (st) => {
              if (head && !head.classList.contains('solid'))
                head.classList.toggle('sky', st.progress > 0.45);
              heroEl.classList.toggle('after', st.progress > 0.72);
            },
          },
        })
        .to(maskRef.current, { scale: 14, ease: 'power2.in', duration: 0.8 }, 0)
        .to(maskRef.current, { opacity: 0, ease: 'none', duration: 0.2 }, 0.62)
        .fromTo(
          afterRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, ease: 'power3.out', duration: 0.3 },
          0.68,
        );
    },
    { scope: heroRef, dependencies: [reduce] },
  );

  return (
    // Stable wrapper so ScrollTrigger's pin-spacer never sits between React siblings.
    <div className="hero-pin">
      <section
        className={reduce ? 'hero static' : 'hero'}
        data-section="hero"
        aria-labelledby="hero-t"
        ref={heroRef}
      >
        <h1 className="sr-only" id="hero-t">
          {hero.srTitle}
        </h1>
        {/* Not aria-hidden (unlike the reference): it holds the Sign in link. */}
        <div className="frame" id="frame" ref={frameRef}>
          <div className="hero-after" id="heroAfter" ref={afterRef}>
            <p className="ha-word">{hero.word}</p>
            <div className="ha-side">
              <p>{hero.side}</p>
              <div className="ha-key">
                <span>
                  <i />
                  {hero.keyTransit}
                </span>
                <span>
                  <i className="r" />
                  {hero.keyOverlap}
                </span>
              </div>
              <div>
                <Link className="btn" to="/login">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
          <HeroScene frameRef={frameRef} heroRef={heroRef} reduce={reduce} />
        </div>
        <svg className="mask" id="mask" aria-hidden="true" ref={maskRef}>
          <defs>
            <mask
              id="knock"
              maskUnits="userSpaceOnUse"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <rect x="-50%" y="-50%" width="200%" height="200%" fill="#fff" />
              <text
                id="kword"
                ref={wordRef}
                x="50%"
                textAnchor="middle"
                fontFamily="Teko, 'Noto Sans Devanagari', sans-serif"
                fontWeight="600"
                fill="#000"
              >
                सेतु
              </text>
            </mask>
          </defs>
          <rect
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            fill="#EDF0F6"
            mask="url(#knock)"
          />
        </svg>
      </section>
    </div>
  );
}
