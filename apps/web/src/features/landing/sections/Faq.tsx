import { faq } from '../content';

export function Faq() {
  return (
    <section className="faq wrap" id="faq" data-tone="base" data-section="faq">
      <div className="fgrid">
        <div className="fside">
          <h2 className="h2">{faq.title}</h2>
          <p>{faq.intro}</p>
        </div>
        <div>
          {faq.items.map((item) => (
            <details key={item.q} className="qa">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
