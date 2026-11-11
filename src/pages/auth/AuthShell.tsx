import { CalendarClock, CheckCircle2, Moon, Sun } from 'lucide-react';
import { ReactNode } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/primitives';

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <CalendarClock className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">WorkFlow</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">Remote work, measured fairly.</h2>
          <p className="mt-4 text-indigo-100">Track attendance, tasks and progress updates for your distributed team — in one place.</p>
          <ul className="mt-8 space-y-3 text-sm text-indigo-50">
            {['One-click work sessions with live timers', 'Break time never counts toward the 8-hour target', 'Two-hour progress updates with smart reminders', 'PDF & Excel monthly timesheets'].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-indigo-200">© {new Date().getFullYear()} WorkFlow. All rights reserved.</p>
      </div>

      <div className="relative flex items-center justify-center p-6">
        <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
