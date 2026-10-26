import { NavLink, Outlet } from 'react-router';
import {
  Landmark,
  LayoutDashboard,
  Files,
  Plus,
  Building2,
  ListTodo,
  Search,
  Network,
  Bell,
  ChartNoAxesCombined,
  LogIn,
} from 'lucide-react';
import { useMocks } from '@/shared/api/client';
const links = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/complaints', 'Complaints', Files],
  ['/complaints/new', 'New complaint', Plus],
  ['/institutions/inst-01', 'Institution profile', Building2],
  ['/bureau-queue', 'Bureau queue', ListTodo],
  ['/investigations/cmp-001', 'Investigation', Search],
  ['/graph/inst-01', 'Knowledge graph', Network],
  ['/alerts', 'Alerts', Bell],
  ['/reports', 'Reports', ChartNoAxesCombined],
  ['/login', 'Login', LogIn],
] as const;
export function AppLayout() {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[238px_1fr]">
      <aside className="border-r bg-white p-5">
        <div className="flex items-center gap-3 py-3">
          <Landmark className="text-primary" />
          <div>
            <strong className="text-xl tracking-tight">CaseBridge</strong>
            <p className="text-xs text-muted-foreground">
              Cross-bureau coordination
            </p>
          </div>
        </div>
        <nav
          aria-label="Main navigation"
          className="mt-7 grid grid-cols-2 gap-1 md:grid-cols-1"
        >
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${isActive ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-8 text-xs leading-5 text-muted-foreground">
          Team Aarohan
          <br />
          SIH26264 · Prototype foundation
        </p>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-6 py-4">
          <span className="text-sm font-medium">
            Investigation & coordination workspace
          </span>
          <span className="rounded-full border px-3 py-1 text-xs">
            {useMocks
              ? 'Mock mode · Synthetic data'
              : 'API mode · Features pending'}
          </span>
        </header>
        <main className="mx-auto max-w-6xl p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
