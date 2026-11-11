import { useState } from 'react';
import ReportDownload from '@/components/ReportDownload';
import { EmptyState, ErrorState, PageHeader, Pagination, StatusBadge, Table, TableSkeleton, Td, Th } from '@/components/ui/data';
import { Card, CardHeader, CardTitle, Field, Input } from '@/components/ui/primitives';
import { useApi } from '@/lib/hooks';
import { fmtDate, fmtDur, fmtTime } from '@/lib/utils';

const TARGET = 8 * 3_600_000;
const attStatus = (s: any) => (s.isOpen ? 'active' : s.workedMs >= TARGET ? 'present' : s.workedMs >= TARGET / 2 ? 'half_day' : 'short');

export default function EmployeeTimesheet() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, loading, error, refetch } = useApi<any>('/sessions/history', { page, limit: 15, from, to });

  return (
    <div>
      <PageHeader title="Timesheet" description="Your attendance history and monthly work report." />
      <Card className="mb-6">
        <CardHeader className="flex-wrap">
          <div>
            <CardTitle>Download monthly report</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Daily start/end, working & break hours, updates, tasks and attendance.</p>
          </div>
          <ReportDownload />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex-wrap">
          <CardTitle>Daily attendance</CardTitle>
          <div className="flex items-end gap-2">
            <Field label="From"><Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="h-9 w-36" /></Field>
            <Field label="To"><Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="h-9 w-36" /></Field>
          </div>
        </CardHeader>
        {loading && !data ? <TableSkeleton cols={7} /> : error ? <ErrorState message={error} onRetry={refetch} /> : !data?.items.length ? (
          <EmptyState title="No attendance records" description="Start a work session to create your first record." />
        ) : (
          <>
            <Table>
              <thead><tr><Th>Date</Th><Th>Start</Th><Th>End</Th><Th>Working</Th><Th>Break</Th><Th>Updates</Th><Th>Status</Th></tr></thead>
              <tbody>
                {data.items.map((s: any) => (
                  <tr key={s._id} className="hover:bg-muted/30">
                    <Td className="font-medium">{fmtDate(s.startTime)}</Td>
                    <Td>{fmtTime(s.startTime)}</Td>
                    <Td>{s.endTime ? fmtTime(s.endTime) : <span className="text-muted-foreground">In progress</span>}</Td>
                    <Td className="tabular">{fmtDur(s.workedMs)}</Td>
                    <Td className="tabular">{fmtDur(s.breakMs)}</Td>
                    <Td className="tabular">{s.updatesCount}</Td>
                    <Td><StatusBadge status={attStatus(s)} /></Td>
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
