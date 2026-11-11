import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { EmptyState, ErrorState, Pagination, StatusBadge, Table, TableSkeleton, Td, Th } from '@/components/ui/data';
import { Badge } from '@/components/ui/primitives';
import { fmtDate, fmtDur, fmtTime } from '@/lib/utils';

const TARGET = 8 * 3_600_000;

/** Admin view of login/logout records. Expand a row to see every break. */
export default function SessionsTable({ data, loading, error, onRetry, onPage, showEmployee = true }: { data: any; loading: boolean; error: string | null; onRetry: () => void; onPage: (p: number) => void; showEmployee?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  if (loading && !data) return <TableSkeleton cols={8} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data?.items.length) return <EmptyState title="No activity found" description="Try widening the date range or choosing a different employee." />;
  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th />
            <Th>Date</Th>
            {showEmployee && <Th>Employee</Th>}
            <Th>Login</Th>
            <Th>Logout</Th>
            <Th>Working</Th>
            <Th>Break</Th>
            <Th>Updates</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((s: any) => {
            const st = s.isOpen ? s.status : s.workedMs >= TARGET ? 'present' : s.workedMs >= TARGET / 2 ? 'half_day' : 'short';
            return (
              <Fragment key={s._id}>
                <tr className="cursor-pointer hover:bg-muted/30" onClick={() => setOpen(open === s._id ? null : s._id)}>
                  <Td className="w-8 pr-0">{open === s._id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</Td>
                  <Td className="whitespace-nowrap font-medium">{fmtDate(s.startTime)}</Td>
                  {showEmployee && <Td>{s.employee?.name}<p className="text-xs text-muted-foreground">{s.employee?.employeeId}</p></Td>}
                  <Td>{fmtTime(s.startTime)}</Td>
                  <Td>{s.endTime ? <>{fmtTime(s.endTime)}{s.autoClosed && <Badge tone="warning" className="ml-1.5">auto</Badge>}</> : <span className="text-muted-foreground">—</span>}</Td>
                  <Td className="tabular">{fmtDur(s.workedMs)}</Td>
                  <Td className="tabular">{fmtDur(s.breakMs)}</Td>
                  <Td className="tabular">{s.updatesCount}</Td>
                  <Td><StatusBadge status={st} /></Td>
                </tr>
                {open === s._id && (
                  <tr className="bg-muted/20">
                    <Td colSpan={showEmployee ? 9 : 8}>
                      <div className="grid gap-4 text-sm sm:grid-cols-3">
                        <div><p className="text-xs text-muted-foreground">Last seen (heartbeat)</p><p>{s.lastHeartbeat ? fmtTime(s.lastHeartbeat) : '—'}</p></div>
                        <div><p className="text-xs text-muted-foreground">Last update submitted</p><p>{s.lastUpdateAt ? fmtTime(s.lastUpdateAt) : 'None yet'}</p></div>
                        <div>
                          <p className="mb-1 text-xs text-muted-foreground">Breaks ({s.breaks.length})</p>
                          {!s.breaks.length ? <p>No breaks</p> : s.breaks.map((b: any) => (
                            <p key={b._id} className="tabular">{fmtTime(b.startTime)} → {b.endTime ? fmtTime(b.endTime) : 'ongoing'} <span className="text-muted-foreground">({fmtDur((b.endTime ? Date.parse(b.endTime) : Date.now()) - Date.parse(b.startTime))})</span></p>
                          ))}
                        </div>
                      </div>
                    </Td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </Table>
      <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={onPage} />
    </>
  );
}
