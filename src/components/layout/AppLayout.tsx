import { Bell, CalendarClock, ClipboardList, FileBarChart, History, LayoutDashboard, ListChecks, LogOut, Menu, Moon, Radar, ScrollText, Sun, UserCircle, Users, WifiOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { useOnline } from '@/lib/hooks';
import { cn, initials, timeAgo } from '@/lib/utils';
import { Button } from '../ui/primitives';

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/employees', label: 'Employees', icon: Users },
  { to: '/admin/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/admin/monitoring', label: 'Monitoring', icon: Radar },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { to: '/admin/audit', label: 'Audit logs', icon: ScrollText },
];
const EMP_NAV = [
  { to: '/employee', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/employee/tasks', label: 'My tasks', icon: ListChecks },
  { to: '/employee/updates', label: 'Work updates', icon: ClipboardList },
  { to: '/employee/timesheet', label: 'Timesheet', icon: History },
];

function NotificationBell({ base }: { base: string }) {
  const { items, unread, markRead, markAll, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">{unread > 9 ? '9+' : unread}</span>
        )}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border bg-card shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <button className="text-xs text-primary hover:underline" onClick={() => void markAll()}>
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">You’re all caught up</p>}
              {items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => {
                    void markRead(n._id);
                    setOpen(false);
                    if (n.link) nav(n.link.startsWith('/admin') || n.link.startsWith('/employee') ? n.link : base + n.link);
                  }}
                  className={cn('flex w-full gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-accent/50', !n.read && 'bg-accent/40')}
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-primary')} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{n.title}</span>
                    <span className="block text-xs text-muted-foreground">{n.message}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))}
            </div>
            <Link to={`${base}/notifications`} onClick={() => setOpen(false)} className="block border-t px-4 py-2.5 text-center text-sm text-primary hover:bg-accent/50">
              View all
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { connected } = useNotifications();
  const online = useOnline();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const isAdmin = user?.role === 'admin';
  const base = isAdmin ? '/admin' : '/employee';
  const items = isAdmin ? ADMIN_NAV : EMP_NAV;

  useEffect(() => setOpen(false), [loc.pathname]);

  const link = (to: string, label: string, Icon: any, end?: boolean) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) =>
        cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold">WorkFlow</p>
          <p className="text-[11px] text-muted-foreground">{isAdmin ? 'Admin console' : 'Employee portal'}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((i) => link(i.to, i.label, i.icon, (i as any).end))}
        {link(`${base}/notifications`, 'Notifications', Bell)}
        {link(`${base}/profile`, 'Profile & security', UserCircle)}
      </nav>
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-md p-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{initials(user?.name)}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.employee?.employeeId ?? user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Log out"
            onClick={async () => {
              await logout();
              nav(isAdmin ? '/admin/login' : '/login');
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r bg-card animate-fade-in">
            <button className="absolute right-3 top-4 rounded p-1 hover:bg-secondary" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <span className={cn('hidden items-center gap-1.5 text-xs sm:flex', connected ? 'text-success' : 'text-muted-foreground')} title={connected ? 'Live updates connected' : 'Reconnecting…'}>
            <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-success' : 'bg-muted-foreground')} />
            {connected ? 'Live' : 'Connecting'}
          </span>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <NotificationBell base={base} />
        </header>
        {!online && (
          <div role="status" className="flex items-center justify-center gap-2 bg-warning/15 px-4 py-2 text-sm text-warning">
            <WifiOff className="h-4 w-4" /> You’re offline. Your work timer keeps running on the server — actions resume when you reconnect.
          </div>
        )}
        <main className="mx-auto max-w-7xl p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
