import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AppHeader } from './AppHeader';
import { BureauProvider } from './BureauContext';
import { CommandPalette } from './CommandPalette';
import { NavDrawer, Sidebar } from './Sidebar';

const COLLAPSE_KEY = 'setu.sidebar';

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

export function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLButtonElement>(null);
  const navButtonRef = useRef<HTMLButtonElement>(null);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? 'collapsed' : 'open');
    } catch {
      // storage unavailable: the choice lasts until reload
    }
  };

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    searchRef.current?.focus();
  }, []);
  // The drawer also asks to close on every route change; only an open drawer
  // hands focus back to the menu button.
  const closeDrawer = useCallback(() => {
    if (!drawerOpen) return;
    setDrawerOpen(false);
    navButtonRef.current?.focus();
  }, [drawerOpen]);

  // Ctrl+K / Cmd+K opens the command palette from anywhere in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <BureauProvider>
      <a
        href="#main"
        className="sr-only z-[60] bg-indigo px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div className="flex min-h-svh">
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
        <div className="min-w-0 flex-1">
          <AppHeader
            onOpenSearch={() => setSearchOpen(true)}
            onOpenNav={() => setDrawerOpen(true)}
            searchRef={searchRef}
            navButtonRef={navButtonRef}
          />
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto max-w-[1280px] p-6 focus:outline-none lg:p-10"
          >
            {/* Keyed by path so each route change replays the calm enter (fade + 8px rise). */}
            <div key={location.pathname} className="route-enter">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <NavDrawer open={drawerOpen} onClose={closeDrawer} />
      {searchOpen && <CommandPalette onClose={closeSearch} />}
    </BureauProvider>
  );
}
