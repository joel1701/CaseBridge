import { useEffect, useId, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface FilterSelect {
  key: string;
  label: string;
  /** The first option is usually "All …" with value ''. */
  options: { value: string; label: string }[];
  /** false for controls that always hold a value (e.g. sort): they don't count as filters. */
  clearable?: boolean;
}

// Search plus square native selects. Controlled: pair it with useUrlState so every
// filter lives in the URL. Search is debounced so typing doesn't rewrite the URL per key.
export function FilterBar({
  values,
  onChange,
  search,
  selects = [],
  className,
}: {
  values: Record<string, string>;
  onChange: (patch: Record<string, string | undefined>) => void;
  search?: { key: string; label: string; placeholder?: string };
  selects?: FilterSelect[];
  className?: string;
}) {
  const uid = useId();
  const urlQuery = search ? (values[search.key] ?? '') : '';
  const [draft, setDraft] = useState(urlQuery);
  const [lastUrl, setLastUrl] = useState(urlQuery);
  // Follow the URL when it changes from outside (back button, "Clear filters").
  if (urlQuery !== lastUrl) {
    setLastUrl(urlQuery);
    setDraft(urlQuery);
  }

  const searchKey = search?.key;
  useEffect(() => {
    if (!searchKey || draft === urlQuery) return;
    const t = setTimeout(
      () => onChange({ [searchKey]: draft.trim() || undefined }),
      300,
    );
    return () => clearTimeout(t);
  }, [draft, urlQuery, searchKey, onChange]);

  const clearable = selects.filter((s) => s.clearable !== false);
  const active = [search?.key, ...clearable.map((s) => s.key)].some(
    (k) => k && values[k],
  );

  return (
    <div
      role="search"
      className={cn('flex flex-wrap items-end gap-3', className)}
    >
      {search && (
        <div className="flex min-w-[min(100%,16rem)] flex-1 flex-col gap-1">
          <label htmlFor={`${uid}-q`} className="wide text-xs text-subtle">
            {search.label}
          </label>
          <div className="relative">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle"
            />
            <input
              id={`${uid}-q`}
              type="search"
              className="field min-h-10 pl-9 text-sm"
              placeholder={search.placeholder}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>
        </div>
      )}
      {selects.map((s) => (
        <div key={s.key} className="flex flex-col gap-1">
          <label
            htmlFor={`${uid}-${s.key}`}
            className="wide text-xs text-subtle"
          >
            {s.label}
          </label>
          <select
            id={`${uid}-${s.key}`}
            className="select"
            value={values[s.key] ?? ''}
            onChange={(e) => onChange({ [s.key]: e.target.value || undefined })}
          >
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      {active && (
        <button
          type="button"
          className="link mb-2.5 text-sm"
          onClick={() =>
            onChange(
              Object.fromEntries(
                [search?.key, ...clearable.map((s) => s.key)]
                  .filter(Boolean)
                  .map((k) => [k!, undefined]),
              ),
            )
          }
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
