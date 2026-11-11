import { Info } from 'lucide-react';
import { useState } from 'react';
import { EmptyState, ErrorState, PageHeader, Pagination, PriorityBadge, SearchInput, StatusBadge, TableSkeleton } from '@/components/ui/data';
import { Card, Progress, Segmented, Select } from '@/components/ui/primitives';
import { useNotifications } from '@/context/NotificationContext';
import { useApi, useDebounced } from '@/lib/hooks';
import { cn, fmtDate, fmtDateTime } from '@/lib/utils';

export default function EmployeeTasks() {
  const { notifTick } = useNotifications();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const { data, loading, error, refetch } = useApi<any>('/tasks', { page, limit: 10, status, priority, q: dq, sort: 'deadline' }, [notifTick]);

  return (
    <div>
      <PageHeader title="My tasks" description="Tasks assigned to you by your administrator." />
      <div className="mb-4 flex items-start gap-2 rounded-lg bg-accent px-4 py-3 text-sm text-accent-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Tasks are managed by your admin. To record progress, choose the task when you submit your 2-hour work update.
      </div>
      <Card>
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search tasks…" className="lg:w-72" />
          <Segmented value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: '', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In progress' }, { value: 'completed', label: 'Completed' }]} />
          <Select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="lg:ml-auto lg:w-40" aria-label="Priority">
            <option value="">All priorities</option>
            {['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
          </Select>
        </div>
        {loading && !data ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : !data?.items.length ? (
          <EmptyState title="No tasks found" description="Nothing matches your filters." />
        ) : (
          <>
            <ul className="divide-y">
              {data.items.map((t: any) => {
                const overdue = t.status !== 'completed' && Date.parse(t.deadline) < Date.now();
                return (
                  <li key={t._id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{t.title}</p>
                        <PriorityBadge priority={t.priority} />
                        <StatusBadge status={t.status} />
                      </div>
                      {t.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>}
                      <p className="mt-1.5 text-xs text-muted-foreground">Assigned {fmtDate(t.assignedDate)}</p>
                    </div>
                    <div className="w-full md:w-56">
                      <p className={cn('mb-1.5 text-xs', overdue ? 'font-medium text-destructive' : 'text-muted-foreground')}>{overdue ? 'Overdue · ' : 'Deadline · '}{fmtDateTime(t.deadline)}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={t.progress} tone={t.status === 'completed' ? 'success' : 'primary'} className="flex-1" />
                        <span className="tabular w-9 text-right text-xs">{t.progress}%</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
