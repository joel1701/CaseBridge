import { useEffect, useRef, type RefObject } from 'react';
import { hero } from '../content';
import { fragmentShader, vertexShader } from './shader';

// Live WebGL sky behind the hero (fallback: the CSS gradient on .frame).
// The canvas is created inside the effect and removed on cleanup, so StrictMode's
// remount gets a fresh context instead of a lost one.
export function HeroScene({
  frameRef,
  heroRef,
  reduce,
  labels = true,
}: {
  frameRef: RefObject<HTMLDivElement | null>;
  heroRef: RefObject<HTMLElement | null>;
  reduce: boolean;
  /** Pylon labels and the overlap call-out that track the bridge (landing hero only). */
  labels?: boolean;
}) {
  const pyL = useRef<HTMLSpanElement>(null);
  const pyR = useRef<HTMLSpanElement>(null);
  const redCall = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frameEl = frameRef.current;
    if (!frameEl) return;
    const cv = document.createElement('canvas');
    cv.id = 'sky';
    frameEl.prepend(cv);
    const gl = cv.getContext('webgl', {
      antialias: false,
      premultipliedAlpha: false,
    });
    const compile = (type: number, src: string) => {
      if (!gl) return null;
      const o = gl.createShader(type);
      if (!o) return null;
      gl.shaderSource(o, src);
      gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(o));
        return null;
      }
      return o;
    };
    const a = gl && compile(gl.VERTEX_SHADER, vertexShader);
    const b = gl && compile(gl.FRAGMENT_SHADER, fragmentShader);
    if (!gl || !a || !b) {
      cv.remove();
      return;
    }
    const pr = gl.createProgram();
    gl.attachShader(pr, a);
    gl.attachShader(pr, b);
    gl.linkProgram(pr);
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const ur = gl.getUniformLocation(pr, 'r');
    const ut = gl.getUniformLocation(pr, 't');
    const urx = gl.getUniformLocation(pr, 'rx');
    const scale =
      Math.min(devicePixelRatio || 1, 1.25) * (innerWidth > 1600 ? 0.75 : 1);
    const t0 = performance.now();

    function draw() {
      if (!gl) return;
      const tt = (performance.now() - t0) / 1000;
      const rxv = (tt * 0.045 + 0.08) % 1;
      gl.uniform2f(ur, cv.width, cv.height);
      gl.uniform1f(ut, tt);
      gl.uniform1f(urx, rxv);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const heroEl = heroRef.current;
      if (
        heroEl?.classList.contains('after') &&
        pyL.current &&
        pyR.current &&
        redCall.current
      ) {
        const W = cv.clientWidth;
        const H = cv.clientHeight;
        pyL.current.style.left = W * 0.34 + 'px';
        pyL.current.style.top = H * 0.3 - 6 + 'px';
        pyR.current.style.left = W * 0.7 + 'px';
        pyR.current.style.top = H * 0.3 - 6 + 'px';
        redCall.current.style.left = rxv * W + 'px';
        redCall.current.style.top = H * (1 - 0.372) + 'px';
        redCall.current.style.opacity = rxv > 0.04 && rxv < 0.96 ? '' : '0';
      }
    }

    function size() {
      if (!gl) return;
      cv.width = Math.round(cv.clientWidth * scale);
      cv.height = Math.round(cv.clientHeight * scale);
      gl.viewport(0, 0, cv.width, cv.height);
      // Resizing clears the canvas; with reduced motion there is no loop to repaint it.
      if (reduce) draw();
    }

    // Render only while the canvas is on screen and the tab is visible.
    let raf = 0;
    let vis = true;
    const frame = () => {
      raf = 0;
      if (!vis || document.hidden) return;
      draw();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!reduce && !raf && vis && !document.hidden)
        raf = requestAnimationFrame(frame);
    };

    const ro = new ResizeObserver(size);
    ro.observe(cv);
    size();
    // Watch the stable .hero-pin wrapper, not the canvas: ScrollTrigger moves the pinned
    // hero in and out of its pin-spacer on every refresh, and the observer then reports
    // the canvas as offscreen and never reports it back, which froze the scene.
    const io = new IntersectionObserver((e) => {
      vis = e[e.length - 1].isIntersecting;
      start();
    });
    io.observe(frameEl.closest('.hero-pin') ?? cv);
    document.addEventListener('visibilitychange', start);
    draw();
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', start);
      cv.remove();
    };
  }, [frameRef, heroRef, reduce]);

  if (!labels) return null;
  return (
    <>
      <span className="pylon" aria-hidden="true" ref={pyL}>
        {hero.pylons[0]}
      </span>
      <span className="pylon" aria-hidden="true" ref={pyR}>
        {hero.pylons[1]}
      </span>
      <div className="redcall" aria-hidden="true" ref={redCall}>
        <b>{hero.redCall.label}</b>
        <span>{hero.redCall.detail}</span>
      </div>
    </>
  );
}
