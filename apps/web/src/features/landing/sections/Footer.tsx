import { footer } from '../content';

export function Footer() {
  return (
    <footer className="wrap" data-tone="base">
      <p className="fword" lang="hi" aria-hidden="true">
        {footer.word}
      </p>
      <div className="frow">
        <nav aria-label="Footer">
          {footer.links.map((l) => (
            <a key={l.href} className="link" href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <small>{footer.note}</small>
      </div>
    </footer>
  );
}
