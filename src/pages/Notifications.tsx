import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, ErrorState, PageHeader, Pagination, TableSkeleton } from '@/components/ui/data';
import { Badge, Button, Card, Segmented } from '@/components/ui/primitives';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import { cn, fmtDateTime } from '@/lib/utils';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifTick, markAll, unread } = useNotifications();
  const nav = useNavigate();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, loading, error, refetch, reload } = useApi<any>('/notifications', { page, limit: 15, unread: filter === 'unread' ? 'true' : '' });
  useEffect(() => void reload(), [notifTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const base = user?.role === 'admin' ? '/admin' : '/employee';

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`${unread} unread`}
        actions={
          <>
            <Segmented value={filter} onChange={(v) => { setFilter(v); setPage(1); }} options={[{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }]} />
            <Button variant="outline" size="sm" disabled={!unread} onClick={async () => { await markAll(); void reload(); }}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          </>
        }
      />
      <Card>
        {loading && !data ? (
          <TableSkeleton rows={6} cols={2} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !data?.items.length ? (
          <EmptyState title="No notifications" description="New activity will show up here." />
        ) : (
          <>
            <ul>
              {data.items.map((n: any) => (
                <li key={n._id}>
                  <button
                    className={cn('flex w-full items-start gap-3 border-b px-5 py-4 text-left hover:bg-accent/40', !n.read && 'bg-accent/30')}
                    onClick={async () => {
                      if (!n.read) await api.patch(`/notifications/${n._id}/read`).catch(() => undefined);
                      void reload();
                      if (n.link) nav(n.link.startsWith('/') && (n.link.startsWith('/admin') || n.link.startsWith('/employee')) ? n.link : base + n.link);
                    }}
                  >
                    <Bell className={cn('mt-0.5 h-4 w-4 shrink-0', n.read ? 'text-muted-foreground' : 'text-primary')} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        {!n.read && <Badge tone="primary">New</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{fmtDateTime(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
