import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Search } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge, Button, Card, Input, Skeleton } from './primitives';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon, hint, tone = 'primary' }: { label: string; value: ReactNode; icon: ReactNode; hint?: string; tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' }) {
  const t = {
    primary: 'bg-accent text-accent-foreground',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-destructive/15 text-destructive',
    info: 'bg-[hsl(var(--chart-5)/0.15)] text-[hsl(var(--chart-5))]',
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="tabular mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md [&>svg]:h-4 [&>svg]:w-4', t)}>{icon}</div>
      </div>
    </Card>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Inbox className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <AlertTriangle className="mb-2 h-6 w-6 text-destructive" />
      <p className="text-sm font-medium">Couldn’t load data</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Pagination({ page, pages, total, limit, onPage }: { page: number; pages: number; total: number; limit: number; onPage: (p: number) => void }) {
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-muted-foreground">
          {page} / {pages}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" aria-label={placeholder} />
    </div>
  );
}

/** responsive table wrapper */
export const Table = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm">{children}</table>
  </div>
);
export const Th = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <th className={cn('whitespace-nowrap border-b bg-muted/40 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground', className)}>{children}</th>
);
export const Td = ({ children, className, colSpan, title }: { children?: ReactNode; className?: string; colSpan?: number; title?: string }) => (
  <td colSpan={colSpan} title={title} className={cn('border-b px-4 py-3 align-middle', className)}>
    {children}
  </td>
);

const PRIORITY: Record<string, 'neutral' | 'info' | 'warning' | 'danger'> = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' };
export const PriorityBadge = ({ priority }: { priority: string }) => (
  <Badge tone={PRIORITY[priority] ?? 'neutral'} className="capitalize">
    {priority}
  </Badge>
);

const STATUS: Record<string, { tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'primary'; label: string }> = {
  pending: { tone: 'neutral', label: 'Pending' },
  in_progress: { tone: 'info', label: 'In progress' },
  completed: { tone: 'success', label: 'Completed' },
  active: { tone: 'success', label: 'Working' },
  on_break: { tone: 'warning', label: 'On break' },
  not_started: { tone: 'neutral', label: 'Not started' },
  offline: { tone: 'neutral', label: 'Offline' },
  present: { tone: 'success', label: 'Present' },
  half_day: { tone: 'warning', label: 'Half day' },
  short: { tone: 'danger', label: 'Short hours' },
  absent: { tone: 'danger', label: 'Absent' },
};
export const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS[status] ?? { tone: 'neutral' as const, label: status };
  return <Badge tone={s.tone}>{s.label}</Badge>;
};
