import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Spec } from '@/components/ui/spec';
import { StatusPill, STATUSES } from '@/components/ui/status-pill';
import { BureauTag } from '@/components/ui/bureau-tag';
import { Skeleton } from '@/components/ui/skeleton';

// Internal reference for the Setu design system (docs/SETU_DESIGN.md). Not linked from the app nav.

const colours: [name: string, hex: string, utility: string, use: string][] = [
  ['--g0', '#0B0E14', 'bg-graphite', 'Page background'],
  ['--g1', '#151A24', 'bg-graphite-1', 'Deep tone, cards'],
  ['--g2', '#1D2330', 'bg-graphite-2', 'Alternate cards'],
  ['--surface', '#11151E', 'bg-surface / bg-card', 'App cards'],
  ['--panel', '#181E2A', 'bg-panel / bg-muted', 'Panels, KPI tiles'],
  ['--line', '#262D3C', 'border-line / border-border', 'Panel borders'],
  ['--line-2', '#2E364A', 'border-line-2', 'Tag borders'],
  ['--ind', '#6E7BFF', 'bg-indigo / bg-primary', 'Primary, indigo band'],
  ['--ind-hi', '#9AA4FF', 'text-indigo-hi', 'Headings, focus ring'],
  ['--ind-deep', '#3442C9', 'text-indigo-deep', 'Headings on paper'],
  ['--paper', '#E6E9F2', 'bg-paper', 'Paper band (rare)'],
  ['--sheet', '#EDF0F6', 'bg-sheet', 'Hero only'],
  ['--ink', '#0B0E14', 'text-ink', 'Text on light and indigo'],
  ['--text', '#EEF1F8', 'text-snow / text-foreground', 'Body text'],
  [
    '--muted',
    '#8C95AB',
    'text-subtle / text-muted-foreground',
    'Secondary text',
  ],
  ['--alert', '#FF5C6C', 'text-alert', 'Overlaps and overdue only'],
];

const display: [label: string, size: string, lh: number, sample: string][] = [
  [
    '.h2 section heading',
    'clamp(46px, 7.4vw, 132px)',
    0.86,
    'two desks. one institution.',
  ],
  ['Poster title', 'clamp(64px, 10vw, 180px)', 0.82, 'case track'],
  ['Engine name', 'clamp(56px, 6vw, 100px)', 0.85, 'matcher'],
  ['Role name', 'clamp(48px, 5vw, 84px)', 0.85, 'bureau head'],
  ['Stop title', 'clamp(30px, 3vw, 44px)', 0.9, 'setu notices'],
  ['Brand', 'clamp(30px, 2.8vw, 40px)', 1, 'setu'],
  ['Dashboard title', '34px', 1, 'overview'],
  ['Card title', '26px', 0.92, 'aaravika institute of engineering'],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="wrap border-t border-line py-16">
      <h2 className="font-display text-[34px] leading-none font-bold lowercase [font-stretch:75%]">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function StyleguidePage() {
  return (
    <div className="min-h-screen">
      <header className="wrap flex items-center gap-[var(--gap)] py-6">
        <Link
          to="/"
          aria-label="Setu, home"
          className="mr-auto font-display text-[clamp(30px,2.8vw,40px)] leading-none font-bold tracking-[-0.01em] lowercase no-underline [font-stretch:75%]"
        >
          setu
        </Link>
        <p className="text-sm text-subtle">
          Style guide · synthetic sample data
        </p>
      </header>

      <div className="wrap pt-10 pb-16">
        <h1 className="h2">style guide</h1>
        <p className="lead mt-6 text-subtle">
          Tokens and components from docs/SETU_DESIGN.md. Press Tab to see focus
          rings.
        </p>
      </div>

      <Section title="colour">
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {colours.map(([name, hex, utility, use]) => (
            <li key={name} className="border border-line bg-surface">
              <span
                className="block h-20 border-b border-line"
                style={{ background: hex }}
              />
              <div className="p-3 text-sm">
                <p className="font-bold">
                  {name} <span className="font-mono text-indigo-hi">{hex}</span>
                </p>
                <p className="mt-1 font-mono text-xs text-subtle">{utility}</p>
                <p className="wide mt-1 text-xs">{use}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-10 grid gap-0 sm:grid-cols-2">
          {(['base', 'deep', 'indigo', 'paper'] as const).map((tone) => (
            <div key={tone} data-tone={tone} className="p-8">
              <p className="h2 !text-[clamp(40px,5vw,72px)]">{tone}</p>
              <p className="mt-4 text-sm">data-tone=&quot;{tone}&quot;</p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Button size="sm" variant="ghost">
                  Ghost
                </Button>
                <a className="link" href="#links">
                  Link
                </a>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="type">
        <dl className="grid gap-10">
          {display.map(([label, size, lh, sample]) => (
            <div key={label}>
              <dt className="wide text-xs text-subtle">
                {label} · {size} / {lh}
              </dt>
              <dd
                className="m-0 mt-2 font-display font-bold break-words lowercase [font-stretch:75%]"
                style={{ fontSize: size, lineHeight: lh }}
              >
                {sample}
              </dd>
            </div>
          ))}
          <div>
            <dt className="wide text-xs text-subtle">
              Manifesto · Special Gothic 600 · clamp(26px, 2.9vw, 48px) / 1.02
            </dt>
            <dd className="m-0 mt-2 max-w-[28ch] font-display text-[clamp(26px,2.9vw,48px)] leading-[1.02] font-semibold [font-stretch:75%]">
              Setu puts every case about an institution on one record.
            </dd>
          </div>
          <div>
            <dt className="wide text-xs text-subtle">
              Devanagari · Teko 600 · footer clamp(140px, 30vw, 520px) / .8
            </dt>
            <dd
              lang="hi"
              className="m-0 mt-2 font-deva text-[clamp(96px,16vw,220px)] leading-[0.8] font-semibold text-graphite-2"
            >
              सेतु
            </dd>
          </div>
          <div>
            <dt className="wide text-xs text-subtle">
              Lead · Hubot Sans · clamp(17px, .6vw + 13px, 21px)
            </dt>
            <dd className="lead m-0 mt-2">
              Each view answers the question an official asks first.
            </dd>
          </div>
          <div>
            <dt className="wide text-xs text-subtle">
              Body · Hubot Sans · clamp(16px, .35vw + 13px, 18px) / 1.5
            </dt>
            <dd className="m-0 mt-2 max-w-[60ch]">
              PGRC and RB each open a case on the same college, under different
              names. Setu matches the permanent ID, the name and the timing.
            </dd>
          </div>
          <div>
            <dt className="wide text-xs text-subtle">
              Wide label · Hubot Sans 125% / 300
            </dt>
            <dd className="wide m-0 mt-2">Overlap detection</dd>
          </div>
          <div>
            <dt className="wide text-xs text-subtle">
              Case ID · monospace 13px
            </dt>
            <dd className="m-0 mt-2 font-mono text-[13px] text-indigo-hi">
              AICTE 1-900000001
            </dd>
          </div>
        </dl>
      </Section>

      <Section title="buttons">
        <div className="grid gap-6">
          {(['default', 'sm'] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-4">
              <Button size={size}>Sign in</Button>
              <Button size={size} variant="ink">
                Ink
              </Button>
              <Button size={size} variant="ghost">
                Explore the views
              </Button>
              <Button size={size} disabled>
                Disabled
              </Button>
              <span className="wide text-xs text-subtle">size={size}</span>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild>
              <Link to="/dashboard">Link as button</Link>
            </Button>
            <a id="links" className="link" href="#links">
              Follow a case
            </a>
          </div>
        </div>
      </Section>

      <Section title="spec">
        <Spec
          items={[
            { label: 'Shows', value: 'Every case, every bureau' },
            { label: 'Keyed by', value: 'AICTE permanent ID' },
            { label: 'Used by', value: 'All officials' },
          ]}
        />
        <Spec
          size="sm"
          className="mt-10"
          items={[
            {
              label: 'The gap',
              value: 'No shared, real-time view across bureaus',
            },
            {
              label: 'The risk',
              value: 'Duplicate work and conflicting action',
            },
            {
              label: 'The fix',
              value: 'One record per institution, overlap alerts',
            },
          ]}
        />
      </Section>

      <Section title="status and bureau">
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <StatusPill key={status} status={status} />
          ))}
        </div>
        <p className="mt-4 text-sm text-subtle">
          Only Overdue is red. Approaching deadline is a warning in indigo.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {['PGRC', 'RB'].map((code) => (
            <BureauTag key={code} code={code} />
          ))}
        </div>
      </Section>

      <Section title="skeleton">
        <div className="grid max-w-md gap-3 border border-line bg-surface p-5">
          <Skeleton className="h-7 w-2/3" label="Loading case" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        </div>
      </Section>

      <footer className="wrap border-t border-line py-8 text-sm text-subtle">
        All sample data on this page is synthetic.
      </footer>
    </div>
  );
}
