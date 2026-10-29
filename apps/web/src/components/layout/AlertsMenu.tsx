import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { getUnreadAlerts } from '@/shared/api/alerts';
import { cn } from '@/shared/utils/cn';
import { Menu, menuItemClass } from './Menu';

const when = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
});

export function AlertsMenu() {
  const { data } = useQuery({
    queryKey: ['alerts', 'unread'],
    queryFn: getUnreadAlerts,
    retry: false,
  });
  const count = data?.total ?? 0;
  const label = count ? `Alerts, ${count} unread` : 'Alerts';

  return (
    <Menu
      label={label}
      trigger={
        <>
          <Bell size={18} aria-hidden="true" />
          {count > 0 && (
            <span
              aria-hidden="true"
              className="min-w-5 bg-indigo-hi px-1 text-center text-xs leading-5 font-bold text-ink tabular-nums"
            >
              {count}
            </span>
          )}
        </>
      }
    >
      {(close) => (
        <>
          {data?.items.length ? (
            data.items.map((a) => {
              const overlap = a.type === 'OVERLAP';
              return (
                <Link
                  key={a.id}
                  role="menuitem"
                  to="/alerts"
                  onClick={close}
                  className={cn(menuItemClass, 'items-start')}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 size-2 flex-none',
                      overlap ? 'alert-pulse bg-alert' : 'bg-indigo-hi',
                    )}
                  />
                  <span className="min-w-0">
                    <span className={cn('block', overlap && 'text-alert')}>
                      {overlap && <span className="sr-only">Overlap: </span>}
                      {a.message}
                    </span>
                    <span className="block text-xs text-subtle">
                      {a.complaintId ?? 'No case'} ·{' '}
                      {when.format(new Date(a.createdAt))}
                    </span>
                  </span>
                </Link>
              );
            })
          ) : (
            <p className="px-3 py-3 text-sm text-subtle">No unread alerts.</p>
          )}
          <div className="mt-1 border-t border-line pt-1">
            <Link
              role="menuitem"
              to="/alerts"
              onClick={close}
              className={menuItemClass}
            >
              View all alerts
            </Link>
          </div>
        </>
      )}
    </Menu>
  );
}
