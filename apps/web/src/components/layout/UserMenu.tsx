import { Link, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, LogIn, LogOut, UserRound } from 'lucide-react';
import { logout, useMe } from '@/shared/api/auth';
import { Menu, menuItemClass } from './Menu';

const roleLabel: Record<string, string> = {
  OFFICER: 'Officer',
  BUREAU_HEAD: 'Bureau head',
  ADMIN: 'Administrator',
};

export function UserMenu() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (!me)
    return (
      <Link
        to="/login"
        className="flex h-10 items-center gap-2 px-3 text-sm text-snow hover:bg-panel"
      >
        <LogIn size={18} aria-hidden="true" />
        Sign in
      </Link>
    );

  async function signOut() {
    try {
      await logout();
    } finally {
      queryClient.clear();
      navigate('/login', { replace: true });
    }
  }

  const role = roleLabel[me.role] ?? me.role;
  return (
    <Menu
      label={`Account: ${me.displayName}`}
      trigger={
        <>
          <UserRound size={18} aria-hidden="true" />
          <span className="hidden max-w-40 truncate lg:inline">
            {me.displayName}
          </span>
          <ChevronDown size={14} aria-hidden="true" className="text-subtle" />
        </>
      }
    >
      {() => (
        <>
          <div className="px-3 pt-2 pb-3">
            <p className="text-sm font-bold">{me.displayName}</p>
            <p className="text-xs text-subtle">
              {role}
              {me.bureauId ? ` · ${me.bureauId}` : ''}
            </p>
          </div>
          <div className="border-t border-line pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => void signOut()}
              className={menuItemClass}
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </>
      )}
    </Menu>
  );
}
