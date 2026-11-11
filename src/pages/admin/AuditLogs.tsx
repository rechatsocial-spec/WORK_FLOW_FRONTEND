import { useEffect, useState } from 'react';
import { EmptyState, ErrorState, PageHeader, Pagination, SearchInput, Table, TableSkeleton, Td, Th } from '@/components/ui/data';
import { Badge, Card, Input } from '@/components/ui/primitives';
import { useApi, useDebounced } from '@/lib/hooks';
import { fmtDateTime } from '@/lib/utils';

const tone = (a: string) => (a.includes('FAILED') || a.includes('DELETED') || a.includes('DEACTIVATED') ? 'danger' : a.startsWith('WORK') || a.startsWith('BREAK') ? 'success' : a.includes('CREATED') ? 'primary' : 'neutral') as any;

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const dq = useDebounced(q);
  useEffect(() => setPage(1), [dq, from, to]);
  const { data, loading, error, refetch } = useApi<any>('/audit', { page, limit: 20, q: dq, from, to });

  return (
    <div>
      <PageHeader title="Audit logs" description="Immutable record of important actions across the system." />
      <Card>
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Search action or user…" className="md:w-80" />
          <div className="flex items-center gap-2 md:ml-auto">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" aria-label="From" />
            <span className="text-muted-foreground">→</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" aria-label="To" />
          </div>
        </div>
        {loading && !data ? <TableSkeleton cols={5} rows={8} /> : error ? <ErrorState message={error} onRetry={refetch} /> : !data?.items.length ? <EmptyState title="No audit entries" /> : (
          <>
            <Table>
              <thead><tr><Th>Time</Th><Th>Actor</Th><Th>Action</Th><Th>Entity</Th><Th>Details</Th><Th>IP</Th></tr></thead>
              <tbody>
                {data.items.map((l: any) => (
                  <tr key={l._id} className="hover:bg-muted/30">
                    <Td className="whitespace-nowrap text-muted-foreground">{fmtDateTime(l.createdAt)}</Td>
                    <Td>{l.actorEmail ?? 'system'}<p className="text-xs capitalize text-muted-foreground">{l.actorRole}</p></Td>
                    <Td><Badge tone={tone(l.action)}>{l.action}</Badge></Td>
                    <Td className="text-muted-foreground">{l.entityType}</Td>
                    <Td className="max-w-xs truncate font-mono text-xs text-muted-foreground" title={l.metadata ? JSON.stringify(l.metadata) : ''}>{l.metadata ? JSON.stringify(l.metadata) : '—'}</Td>
                    <Td className="text-xs text-muted-foreground">{l.ip}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
