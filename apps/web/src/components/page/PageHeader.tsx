import type { ReactNode } from 'react';
import type { Scope } from '@/shared/types';

// Page title in the display font, an optional one-line description and an action slot.
// No eyebrow. Shows "Synthetic data" whenever the page's data came from the synthetic store.
export function PageHeader({
  title,
  description,
  actions,
  scope,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  scope?: Scope;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0">
        <h1 className="font-display text-[clamp(40px,4.6vw,64px)] leading-[0.86] font-bold tracking-[-0.012em] text-balance text-indigo-hi lowercase [font-stretch:75%]">
          {title}
        </h1>
        {(description || scope === 'SYNTHETIC') && (
          <p className="mt-3 max-w-[70ch] text-sm text-subtle">
            {description}
            {description && scope === 'SYNTHETIC' && ' · '}
            {scope === 'SYNTHETIC' && (
              <>
                <span className="font-bold text-snow">Synthetic data</span>
                <span className="wide text-xs"> — not live bureau records</span>
              </>
            )}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </header>
  );
}
