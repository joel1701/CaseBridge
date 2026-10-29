import type { RefObject } from 'react';
import { manifesto } from '../content';
import { Spec } from '@/components/ui/spec';

export function Manifesto({
  manifestoRef,
}: {
  manifestoRef: RefObject<HTMLElement | null>;
}) {
  return (
    <section
      className="manifesto wrap"
      data-tone="base"
      data-section="manifesto"
      ref={manifestoRef}
    >
      <p className="mf">
        {manifesto.before}
        <strong>{manifesto.strong}</strong>
        {manifesto.after}
      </p>
      <div className="mf-foot">
        <p>
          {manifesto.footLines[0]}
          <br />
          {manifesto.footLines[1]}
        </p>
        <Spec items={manifesto.spec} />
      </div>
    </section>
  );
}
