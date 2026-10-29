import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/shared/utils/cn';
import type { PageMeta } from '@/shared/types';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** The API sort field this column sorts by (e.g. 'createdAt'). */
  sortKey?: string;
  align?: 'left' | 'right';
  /** On phones: the card title, a labelled detail line, or hidden. Default 'meta'. */
  mobile?: 'primary' | 'meta' | 'hidden';
  className?: string;
}
export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

// Server-driven table: sorting and paging are controlled (keep them in the URL with
// useUrlState and pass them to the API). The first column holds the row's link.
// Below md it becomes a stacked list of cards instead of a sideways-scrolling table.
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  rowHref,
  rowLabel,
  sort,
  onSort,
  loading,
  meta,
  onPage,
  empty,
}: {
  caption: string;
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  /** Accessible name for the row link (defaults to the primary cell's text). */
  rowLabel?: (row: T) => string;
  sort?: SortState;
  onSort?: (next: SortState) => void;
  loading?: boolean;
  meta?: PageMeta;
  onPage?: (page: number) => void;
  empty?: ReactNode;
}) {
  const primary = columns.find((c) => c.mobile === 'primary') ?? columns[0];
  const metaCols = columns.filter(
    (c) => c !== primary && c.mobile !== 'hidden',
  );
  const showSkeleton = loading && !rows?.length;

  const toggle = (c: Column<T>) => {
    if (!c.sortKey || !onSort) return;
    onSort(
      sort?.key === c.sortKey
        ? { key: c.sortKey, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
        : { key: c.sortKey, dir: 'desc' },
    );
  };

  const firstCell = (row: T, c: Column<T>) =>
    rowHref ? (
      <Link
        to={rowHref(row)}
        aria-label={rowLabel?.(row)}
        className="font-bold no-underline after:absolute after:inset-0 hover:underline"
      >
        {c.cell(row)}
      </Link>
    ) : (
      c.cell(row)
    );

  if (!showSkeleton && rows && rows.length === 0)
    return (
      <>
        {empty ?? (
          <EmptyState
            title="Nothing matches these filters"
            body="Try a different search, or clear the filters."
          />
        )}
      </>
    );

  return (
    <div
      className={cn(
        loading && rows?.length
          ? 'opacity-60 transition-opacity'
          : 'transition-opacity',
      )}
    >
      {/* Table: md and up */}
      <div className="hidden overflow-x-clip md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => {
                const sorted = c.sortKey && sort?.key === c.sortKey;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={
                      sorted
                        ? sort!.dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                    className={cn(
                      'sticky top-16 z-10 border-b border-line bg-graphite-1 px-3 py-2.5 text-xs font-bold text-subtle first:pl-0',
                      c.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {c.sortKey && onSort ? (
                      <button
                        type="button"
                        onClick={() => toggle(c)}
                        className="inline-flex items-center gap-1 hover:text-snow"
                      >
                        {c.header}
                        {sorted &&
                          (sort!.dir === 'asc' ? (
                            <ArrowUp size={12} aria-hidden="true" />
                          ) : (
                            <ArrowDown size={12} aria-hidden="true" />
                          ))}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {showSkeleton
              ? Array.from({ length: meta?.pageSize ?? 8 }, (_, i) => (
                  <tr key={i} className="border-b border-line">
                    {columns.map((c) => (
                      <td key={c.key} className="px-3 py-3.5 first:pl-0">
                        <Skeleton className="h-4 w-full max-w-40" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows!.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className="relative border-b border-line hover:bg-panel/50"
                  >
                    {columns.map((c, i) => (
                      <td
                        key={c.key}
                        className={cn(
                          'px-3 py-3 align-top first:pl-0',
                          c.align === 'right' && 'text-right tabular-nums',
                          c.className,
                        )}
                      >
                        {i === 0 ? firstCell(row, c) : c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Stacked list: below md */}
      <ul aria-label={caption} className="grid gap-2 md:hidden">
        {showSkeleton
          ? Array.from({ length: 5 }, (_, i) => (
              <li
                key={i}
                className="grid gap-2 border border-line bg-graphite p-4"
              >
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </li>
            ))
          : rows!.map((row) => (
              <li
                key={rowKey(row)}
                className="relative border border-line bg-graphite p-4"
              >
                <div className="text-[15px]">{firstCell(row, primary)}</div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  {metaCols.map((c) => (
                    <div key={c.key} className="contents">
                      <dt className="text-xs text-subtle">{c.header}</dt>
                      <dd className="min-w-0">{c.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
      </ul>

      {meta && onPage && <Pagination meta={meta} onPage={onPage} />}
    </div>
  );
}

export function Pagination({
  meta,
  onPage,
}: {
  meta: PageMeta;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(meta.total / meta.pageSize));
  if (meta.total === 0) return null;
  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.total, meta.page * meta.pageSize);
  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-subtle tabular-nums" aria-live="polite">
        {from}–{to} of {meta.total}
        <span className="sr-only">
          , page {meta.page} of {pages}
        </span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
        >
          <ChevronLeft size={16} aria-hidden="true" /> Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={meta.page >= pages}
          onClick={() => onPage(meta.page + 1)}
        >
          Next <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
