import { useEffect, type RefObject } from 'react';
import { Link } from 'react-router';
import { navLinks } from '../content';

// Fixed nav that takes the colour of what's behind it: ink over the light hero,
// .sky while the hero opens (set by Hero), .solid once the manifesto reaches it.
export function SiteNav({
  navRef,
  manifestoRef,
}: {
  navRef: RefObject<HTMLElement | null>;
  manifestoRef: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const head = navRef.current;
    const manifesto = manifestoRef.current;
    if (!head || !manifesto) return;
    const headTone = () => {
      const m = manifesto.getBoundingClientRect().top;
      head.classList.toggle('solid', m <= head.offsetHeight + 1);
      if (head.classList.contains('solid')) head.classList.remove('sky');
    };
    addEventListener('scroll', headTone, { passive: true });
    headTone();
    return () => removeEventListener('scroll', headTone);
  }, [navRef, manifestoRef]);

  return (
    <header className="head wrap" data-section="nav" ref={navRef}>
      <a className="brand" href="#top" aria-label="Setu, home">
        setu
      </a>
      <nav className="nav" aria-label="Main">
        {navLinks.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
      <Link className="btn" to="/login">
        Sign in
      </Link>
    </header>
  );
}
