import type { RefObject } from 'react';
import { Menu as MenuIcon, Search } from 'lucide-react';
import { useMocks } from '@/shared/api/client';
import { AlertsMenu } from './AlertsMenu';
import { BureauMenu } from './BureauMenu';
import { UserMenu } from './UserMenu';

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform);

export function AppHeader({
  onOpenSearch,
  onOpenNav,
  searchRef,
  navButtonRef,
}: {
  onOpenSearch: () => void;
  onOpenNav: () => void;
  searchRef: RefObject<HTMLButtonElement | null>;
  navButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-graphite px-4 lg:px-6">
      <button
        ref={navButtonRef}
        type="button"
        onClick={onOpenNav}
        className="grid size-10 place-items-center text-snow hover:bg-panel md:hidden"
      >
        <MenuIcon size={20} aria-hidden="true" />
        <span className="sr-only">Open navigation</span>
      </button>
      <span className="font-display text-[28px] leading-none font-bold lowercase [font-stretch:75%] md:hidden">
        setu
      </span>

      <button
        ref={searchRef}
        type="button"
        onClick={onOpenSearch}
        aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
        className="flex h-10 items-center gap-3 border border-line bg-surface px-3 text-sm text-subtle hover:border-line-2 hover:text-snow max-md:ml-auto max-md:w-10 max-md:justify-center max-md:px-0 md:w-[min(360px,40vw)]"
      >
        <Search size={16} aria-hidden="true" className="flex-none" />
        <span className="max-md:sr-only">Search cases and institutions</span>
        <kbd className="wide ml-auto text-xs max-md:hidden">
          {isMac ? '⌘K' : 'Ctrl K'}
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <span className="wide mr-2 hidden text-xs text-subtle lg:inline">
          {useMocks ? 'Synthetic data' : 'Live API'}
        </span>
        <div className="hidden sm:block">
          <BureauMenu />
        </div>
        <AlertsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
