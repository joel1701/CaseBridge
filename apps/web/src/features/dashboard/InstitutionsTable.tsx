import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { BureauTag } from '@/components/ui/bureau-tag';
import type { DashboardOverview } from '@/shared/types';
import { Panel } from './Panel';

type Row = DashboardOverview['multiBureauInstitutions'][number];
type SortKey = 'name' | 'region' | 'openCases' | 'overlaps' | 'lastActivityAt';

const columns: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'name', label: 'Institution' },
  { key: 'openCases', label: 'Open', numeric: true },
  { key: 'overlaps', label: 'Overlaps', numeric: true },
  { key: 'lastActivityAt', label: 'Last activity' },
];

const date = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
});

export function InstitutionsTable({ rows }: { rows: Row[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'openCases',
    dir: 'desc',
  });
  const sorted = useMemo(() => {
    const out = [...rows].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      return typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x).localeCompare(String(y));
    });
    return sort.dir === 'asc' ? out : out.reverse();
  }, [rows, sort]);

  const toggle = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' || key === 'region' ? 'asc' : 'desc' },
    );

  return (
    <Panel
      title="multi-bureau institutions"
      titleId="institutions-title"
      meta={`${rows.length} with open cases at two or more bureaus`}
    >
      {rows.length ? (
        <div className="-mx-5 overflow-x-auto px-5 lg:-mx-6 lg:px-6">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={
                      sort.key === c.key
                        ? sort.dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                    className={c.numeric ? 'text-right' : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(c.key)}
                      className="inline-flex items-center gap-1 py-2.5 text-xs font-bold text-subtle hover:text-snow"
                    >
                      {c.label}
                      {sort.key === c.key &&
                        (sort.dir === 'asc' ? (
                          <ArrowUp size={12} aria-hidden="true" />
                        ) : (
                          <ArrowDown size={12} aria-hidden="true" />
                        ))}
                    </button>
                  </th>
                ))}
                <th
                  scope="col"
                  className="py-2.5 text-xs font-bold text-subtle"
                >
                  Bureaus
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr
                  key={r.institutionId}
                  className="border-b border-line hover:bg-panel/50"
                >
                  <td className="py-3 pr-4">
                    <Link
                      to={`/institutions/${r.institutionId}`}
                      className="font-bold no-underline hover:underline"
                    >
                      {r.name}
                    </Link>
                    <p className="text-xs text-subtle">
                      <span className="font-mono text-indigo-hi">
                        {r.permanentId}
                      </span>{' '}
                      · {r.region} office
                    </p>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {r.openCases}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {r.overlaps}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-subtle tabular-nums">
                    {date.format(new Date(r.lastActivityAt))}
                  </td>
                  <td className="py-3">
                    <span className="flex gap-1">
                      {r.bureaus.map((b) => (
                        <BureauTag key={b} code={b} />
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-6 text-subtle">
          No institution has open cases at more than one bureau.
        </p>
      )}
    </Panel>
  );
}
