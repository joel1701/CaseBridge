import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { Building2, FileText, Search, type LucideIcon } from 'lucide-react';
import { complaints, institutions } from '@/shared/api/mock';
import { cn } from '@/shared/utils/cn';
import { navItems } from './nav';
import { trapTab } from './useDismiss';

interface Result {
  id: string;
  group: 'Pages' | 'Institutions' | 'Complaints';
  label: string;
  detail?: string;
  to: string;
  icon: LucideIcon;
}

// Search index. Institutions and complaints come from the shared mock data for now.
const index: Result[] = [
  ...navItems.map((n) => ({
    id: `page-${n.to}`,
    group: 'Pages' as const,
    label: n.label,
    to: n.to,
    icon: n.icon,
  })),
  ...institutions.map((i) => ({
    id: `inst-${i.id}`,
    group: 'Institutions' as const,
    label: i.name,
    detail: i.permanentId,
    to: `/institutions/${i.id}`,
    icon: Building2,
  })),
  ...complaints.map((c) => ({
    id: `cmp-${c.id}`,
    group: 'Complaints' as const,
    label: c.originalId,
    detail: c.title,
    to: `/complaints/${c.id}`,
    icon: FileText,
  })),
];

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

function search(query: string): Result[] {
  // "AICTE 1-900000001" should find permanent IDs written as "SYN-AICTE-1-900000001".
  const q = norm(query).replace(/^aicte[\s-]*/, '');
  if (!q) return index.filter((r) => r.group === 'Pages');
  return index.filter((r) =>
    [r.label, r.detail ?? '', r.to.split('/').pop() ?? ''].some((f) =>
      norm(f).includes(q),
    ),
  );
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const uid = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => search(query), [query]);
  const current = Math.min(active, results.length - 1);

  function go(r: Result | undefined) {
    if (!r) return;
    onClose();
    navigate(r.to);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault();
      setActive((current + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault();
      setActive((current - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[current]);
    } else trapTab(e, dialogRef.current);
  }

  const groups = (['Pages', 'Institutions', 'Complaints'] as const)
    .map((g) => ({ g, items: results.filter((r) => r.group === g) }))
    .filter((x) => x.items.length);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-[rgba(11,14,20,.7)]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search Setu"
        onKeyDown={onKey}
        className="relative w-full max-w-xl border border-line bg-surface shadow-[0_18px_40px_rgba(11,14,20,.35)]"
      >
        {/* The input's focus ring is this 2px rule, since an outline would hug the dialog edge. */}
        <div className="flex items-center gap-3 border-b border-line px-4 focus-within:shadow-[inset_0_-2px_0_var(--ind-hi)]">
          <Search
            size={18}
            aria-hidden="true"
            className="flex-none text-subtle"
          />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={`${uid}-list`}
            aria-activedescendant={
              results[current] ? `${uid}-${results[current].id}` : undefined
            }
            aria-autocomplete="list"
            aria-label="Search institutions, complaints and pages"
            placeholder="Institution name or AICTE ID, case ID, page"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            className="h-14 w-full bg-transparent text-base text-snow placeholder:text-subtle focus-visible:outline-none"
          />
          <kbd className="wide hidden text-xs text-subtle sm:block">Esc</kbd>
        </div>
        <div
          id={`${uid}-list`}
          role="listbox"
          aria-label="Results"
          className="max-h-[min(420px,60vh)] overflow-y-auto py-2"
        >
          {groups.map(({ g, items }) => (
            <div key={g} role="group" aria-label={g}>
              <p
                className="wide px-4 pt-2 pb-1 text-xs text-subtle"
                aria-hidden="true"
              >
                {g}
              </p>
              {items.map((r) => {
                const i = results.indexOf(r);
                const Icon = r.icon;
                return (
                  <div
                    key={r.id}
                    id={`${uid}-${r.id}`}
                    role="option"
                    aria-selected={i === current}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm',
                      i === current
                        ? 'bg-panel text-snow shadow-[inset_3px_0_0_var(--ind)]'
                        : 'text-subtle',
                    )}
                  >
                    <Icon size={16} aria-hidden="true" className="flex-none" />
                    <span className="min-w-0 truncate text-snow">
                      {r.label}
                    </span>
                    {r.detail && (
                      <span className="ml-auto min-w-0 truncate font-mono text-xs text-subtle">
                        {r.detail}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {!results.length && (
            <p className="px-4 py-6 text-sm text-subtle" role="status">
              Nothing matches “{query}”.
            </p>
          )}
        </div>
        <p className="border-t border-line px-4 py-2 text-xs text-subtle">
          ↑ ↓ to move · Enter to open · Synthetic data
        </p>
      </div>
    </div>
  );
}
