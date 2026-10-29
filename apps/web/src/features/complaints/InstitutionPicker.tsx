import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { institutionKeys, listInstitutions } from '@/shared/api/institutions';
import { cn } from '@/shared/utils/cn';
import type { InstitutionSummary } from '@/shared/types';

// Searchable institution field over GET /institutions?q= (name or AICTE permanent ID).
export function InstitutionPicker({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  disabled,
}: {
  id: string;
  value: InstitutionSummary | null;
  onChange: (inst: InstitutionSummary | null) => void;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
}) {
  const listId = useId();
  const [text, setText] = useState(value ? value.name : '');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 200);
    return () => clearTimeout(t);
  }, [text]);

  const results = useQuery({
    queryKey: institutionKeys.list({ q, pageSize: 8 }),
    queryFn: () => listInstitutions({ q: q || undefined, pageSize: 8 }),
    enabled: open,
  });
  const items = results.data?.items ?? [];

  const choose = (inst: InstitutionSummary) => {
    onChange(inst);
    setText(inst.name);
    setOpen(false);
  };

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && open && items[active]) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        className="field mt-2"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && items[active] ? `${listId}-${items[active].id}` : undefined
        }
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        disabled={disabled}
        placeholder="Type a name or AICTE ID"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(0);
          if (value) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKey}
      />
      {value && (
        <p className="mt-1 font-mono text-xs text-indigo-hi">
          {value.permanentId}
        </p>
      )}
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Institutions"
          className="absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto border border-line bg-surface py-1 shadow-[0_18px_40px_rgba(11,14,20,.35)]"
        >
          {items.map((inst, i) => (
            <li
              key={inst.id}
              id={`${listId}-${inst.id}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(inst);
              }}
              onMouseMove={() => setActive(i)}
              className={cn(
                'cursor-pointer px-3 py-2 text-sm',
                i === active && 'bg-panel shadow-[inset_3px_0_0_var(--ind)]',
              )}
            >
              <span className="block">{inst.name}</span>
              <span className="block font-mono text-xs text-subtle">
                {inst.permanentId} · {inst.region} office
              </span>
            </li>
          ))}
          {!items.length && (
            <li className="px-3 py-2 text-sm text-subtle">
              {results.isFetching
                ? 'Searching…'
                : 'No institution matches. Check the name or AICTE ID.'}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
