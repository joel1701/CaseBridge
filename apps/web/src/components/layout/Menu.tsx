import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/shared/utils/cn';
import { useDismiss } from './useDismiss';

// Header dropdown: trigger button + role="menu" list. Arrow keys, Home and End move
// between items; Escape, Tab or a click outside closes it and focus returns to the trigger.
export function Menu({
  trigger,
  label,
  align = 'end',
  className,
  children,
}: {
  trigger: ReactNode;
  label: string;
  align?: 'start' | 'end';
  className?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inside = useMemo(() => [triggerRef, listRef], []);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);
  useDismiss(open, close, inside);

  const items = () => [
    ...(listRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ??
      []),
  ];

  useEffect(() => {
    if (!open) return;
    const all = items();
    (
      all.find((el) => el.getAttribute('aria-checked') === 'true') ?? all[0]
    )?.focus();
  }, [open]);

  function onListKey(e: KeyboardEvent) {
    const all = items();
    const i = all.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      all[(n + all.length) % all.length]?.focus();
    };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(all.length - 1);
    else if (e.key === 'Tab') setOpen(false);
  }

  function onTriggerKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
        className={cn(
          'flex h-10 items-center gap-2 px-3 text-sm text-snow hover:bg-panel',
          open && 'bg-panel',
          className,
        )}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={listRef}
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={onListKey}
          className={cn(
            'absolute top-[calc(100%+6px)] z-40 min-w-56 border border-line bg-surface py-1 shadow-[0_18px_40px_rgba(11,14,20,.35)]',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          <MenuItems render={children} close={close} />
        </div>
      )}
    </div>
  );
}

// Renders the items as their own component so `close` is passed as a prop, not called during render.
function MenuItems({
  render,
  close,
}: {
  render: (close: () => void) => ReactNode;
  close: () => void;
}) {
  return render(close);
}

export const menuItemClass =
  'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-snow hover:bg-panel focus-visible:bg-panel focus-visible:outline-offset-[-2px]';
