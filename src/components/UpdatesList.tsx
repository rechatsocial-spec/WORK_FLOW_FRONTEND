import { EmptyState, ErrorState, Pagination, TableSkeleton } from '@/components/ui/data';
import { Badge } from '@/components/ui/primitives';
import { fmtDateTime } from '@/lib/utils';

/** Admin-facing list of submitted work updates */
export default function UpdatesList({ data, loading, error, onRetry, onPage }: { data: any; loading: boolean; error: string | null; onRetry: () => void; onPage: (p: number) => void }) {
  if (loading && !data) return <TableSkeleton rows={4} cols={3} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data?.items.length) return <EmptyState title="No updates found" />;
  return (
    <>
      <ul className="divide-y">
        {data.items.map((u: any) => (
          <li key={u._id} className="space-y-2 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{u.employee?.name} <span className="font-normal text-muted-foreground">· {u.task?.title ?? 'General work'}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="primary">{u.progress}%</Badge>
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
      <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={onPage} />
    </>
  );
}
