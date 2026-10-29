import {
  Bell,
  Building2,
  ChartNoAxesCombined,
  Files,
  LayoutDashboard,
  ListTodo,
  Network,
  Plus,
  Search,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/alerts', label: 'Alerts', icon: Bell },
    ],
  },
  {
    label: 'Cases',
    items: [
      { to: '/complaints', label: 'Complaints', icon: Files },
      { to: '/complaints/new', label: 'New complaint', icon: Plus },
      { to: '/bureau-queue', label: 'Bureau queue', icon: ListTodo },
    ],
  },
  {
    label: 'Institutions',
    items: [
      {
        to: '/institutions/inst-01',
        label: 'Institution profile',
        icon: Building2,
      },
      { to: '/graph/inst-01', label: 'Knowledge graph', icon: Network },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { to: '/investigations/cmp-001', label: 'Investigation', icon: Search },
      { to: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
    ],
  },
];

export const navItems = navGroups.flatMap((g) => g.items);
