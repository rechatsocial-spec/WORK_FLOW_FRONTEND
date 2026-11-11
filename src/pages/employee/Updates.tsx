import { useState } from 'react';
import UpdateForm from '@/components/UpdateForm';
import { EmptyState, ErrorState, PageHeader, Pagination, TableSkeleton } from '@/components/ui/data';
import { Badge, Card, CardContent, CardHeader, CardTitle, Field, Input } from '@/components/ui/primitives';
import { useNotifications } from '@/context/NotificationContext';
import { useApi } from '@/lib/hooks';
import { fmtDateTime, fmtTime } from '@/lib/utils';

export default function EmployeeUpdates() {
  const { notifTick } = useNotifications();
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const today = useApi<any>('/sessions/today', {}, [notifTick]);
  const tasks = useApi<any>('/tasks', { all: 'true', sort: 'deadline' });
  const { data, loading, error, refetch, reload } = useApi<any>('/updates', { page, limit: 8, from, to }, [notifTick]);
  const open = today.data?.status === 'active' || today.data?.status === 'on_break';

  return (
    <div>
      <PageHeader title="Work updates" description="Submit a progress update every two hours while you’re working." />
      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New update</CardTitle>
            {open && today.data?.nextUpdateDue && <Badge tone="primary">Next due {fmtTime(today.data.nextUpdateDue)}</Badge>}
          </CardHeader>
          <CardContent>
            <UpdateForm
              tasks={(tasks.data?.items ?? []).filter((t: any) => t.status !== 'completed')}
              disabledReason={today.data && !open ? 'You need an active work session to submit updates.' : undefined}
              onDone={() => { void today.reload(); void reload(); void tasks.reload(); }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-wrap">
            <CardTitle>Update history</CardTitle>
            <div className="flex items-end gap-2">
              <Field label="From"><Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="h-9 w-36" /></Field>
              <Field label="To"><Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="h-9 w-36" /></Field>
            </div>
          </CardHeader>
          {loading && !data ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={refetch} /> : !data?.items.length ? (
            <EmptyState title="No updates yet" description="Your submitted updates will be listed here." />
          ) : (
            <>
              <ul className="divide-y">
                {data.items.map((u: any) => (
                  <li key={u._id} className="space-y-2 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{u.task?.title ?? 'General work'}</p>
                      <div className="flex items-center gap-2">
                        <Badge tone="primary">{u.progress}% complete</Badge>
                        <span className="text-xs text-muted-foreground">{fmtDateTime(u.submittedAt)}</span>
                      </div>
                    </div>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div><dt className="text-xs font-medium text-muted-foreground">Completed</dt><dd className="mt-0.5 whitespace-pre-wrap">{u.completedWork}</dd></div>
                      <div><dt className="text-xs font-medium text-muted-foreground">Pending</dt><dd className="mt-0.5 whitespace-pre-wrap">{u.pendingWork}</dd></div>
                      {u.challenges && <div className="sm:col-span-2"><dt className="text-xs font-medium text-warning">Challenges</dt><dd className="mt-0.5 whitespace-pre-wrap">{u.challenges}</dd></div>}
                    </dl>
                  </li>
                ))}
              </ul>
              <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
