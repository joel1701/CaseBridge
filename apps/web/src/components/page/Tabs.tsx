import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface TabDef<K extends string> {
  key: K;
  label: string;
}

// Accessible tabs: role="tablist", roving tabindex, arrow keys / Home / End move and select.
// Pair with <TabPanel id={id} value={value}> using the same `id`.
export function Tabs<K extends string>({
  id,
  label,
  tabs,
  value,
  onChange,
  className,
}: {
  id: string;
  label: string;
  tabs: readonly TabDef<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  function onKey(e: KeyboardEvent) {
    const i = tabs.findIndex((t) => t.key === value);
    const to =
      e.key === 'ArrowRight'
        ? (i + 1) % tabs.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + tabs.length) % tabs.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? tabs.length - 1
              : -1;
    if (to < 0) return;
    e.preventDefault();
    onChange(tabs[to].key);
    listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[to]?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKey}
      className={cn(
        'flex max-w-full overflow-x-auto border border-line',
        className,
      )}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          id={`${id}-${t.key}-tab`}
          aria-selected={value === t.key}
          aria-controls={`${id}-panel`}
          tabIndex={value === t.key ? 0 : -1}
          onClick={() => onChange(t.key)}
          className={cn(
            'h-9 flex-none px-3 text-sm whitespace-nowrap',
            value === t.key
              ? 'bg-panel text-snow shadow-[inset_0_-2px_0_var(--ind)]'
              : 'text-subtle hover:text-snow',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({
  id,
  value,
  children,
  className,
}: {
  id: string;
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      id={`${id}-panel`}
      role="tabpanel"
      aria-labelledby={`${id}-${value}-tab`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}
