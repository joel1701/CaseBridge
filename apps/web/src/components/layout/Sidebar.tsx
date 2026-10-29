import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { navGroups } from './nav';
import { trapTab } from './useDismiss';
import { BureauMenu } from './BureauMenu';

function NavList({ collapsed }: { collapsed: boolean }) {
  return (
    <nav aria-label="Main navigation" className="mt-6 grid gap-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p
            className={cn(
              'wide mb-2 px-3 text-xs text-subtle',
              collapsed && 'sr-only',
            )}
          >
            {group.label}
          </p>
          <ul className="grid gap-0.5">
            {group.items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex h-10 items-center gap-3 px-3 text-sm transition-colors duration-200',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-panel text-snow shadow-[inset_3px_0_0_var(--ind)]'
                        : 'text-subtle hover:bg-panel/60 hover:text-snow',
                    )
                  }
                >
                  <Icon size={18} aria-hidden="true" className="flex-none" />
                  <span className={cn(collapsed && 'sr-only')}>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      to="/dashboard"
      aria-label="Setu, dashboard"
      className={cn(
        'block font-display text-[36px] leading-none font-bold tracking-[-0.01em] lowercase no-underline [font-stretch:75%]',
        collapsed && 'text-center text-[28px]',
      )}
    >
      setu
    </Link>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-svh flex-col border-r border-line bg-graphite px-3 py-5 md:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="px-2">
        <Brand collapsed={collapsed} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavList collapsed={collapsed} />
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={collapsed}
        className={cn(
          'mt-4 flex h-10 items-center gap-3 px-3 text-sm text-subtle hover:bg-panel hover:text-snow',
          collapsed && 'justify-center px-0',
        )}
      >
        {collapsed ? (
          <PanelLeftOpen size={18} aria-hidden="true" />
        ) : (
          <PanelLeftClose size={18} aria-hidden="true" />
        )}
        <span className={cn(collapsed && 'sr-only')}>Collapse sidebar</span>
      </button>
    </aside>
  );
}

// Below md: the same navigation as a modal drawer.
export function NavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onClose();
    // Close when the route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-[rgba(11,14,20,.7)]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        onKeyDown={(e) => trapTab(e, panelRef.current)}
        className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-line bg-graphite px-3 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-5"
      >
        <div className="flex items-center justify-between px-2">
          <Brand collapsed={false} />
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center text-subtle hover:bg-panel hover:text-snow"
          >
            <X size={20} aria-hidden="true" />
            <span className="sr-only">Close navigation</span>
          </button>
        </div>
        {/* The header has no room for the bureau switcher on phones, so it lives here. */}
        <div className="mt-5 border-y border-line py-2 sm:hidden">
          <BureauMenu />
        </div>
        <NavList collapsed={false} />
      </div>
    </div>
  );
}
