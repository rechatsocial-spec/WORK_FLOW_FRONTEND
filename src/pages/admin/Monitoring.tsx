import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmployeeSelect from '@/components/EmployeeSelect';
import SessionsTable from '@/components/SessionsTable';
import UpdatesList from '@/components/UpdatesList';
import { EmptyState, ErrorState, PageHeader, StatusBadge, Table, TableSkeleton, Td, Th } from '@/components/ui/data';
import { Badge, Card, Field, Input, Segmented } from '@/components/ui/primitives';
import { useNotifications } from '@/context/NotificationContext';
import { useApi } from '@/lib/hooks';
import { fmtDur, fmtTime, todayKey } from '@/lib/utils';

type Tab = 'live' | 'logs' | 'updates' | 'missing';

export default function AdminMonitoring() {
  const { monitorTick } = useNotifications();
  const [tab, setTab] = useState<Tab>('live');
  const [employeeId, setEmployeeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(todayKey());
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [tab, employeeId, from, to]);

  const live = useApi<any>(tab === 'live' ? '/monitoring/live' : null);
  const logs = useApi<any>(tab === 'logs' ? '/monitoring/sessions' : null, { page, limit: 10, employeeId, from, to });
  const updates = useApi<any>(tab === 'updates' ? '/updates' : null, { page, limit: 8, employeeId, from, to });
  const missing = useApi<any>(tab === 'missing' ? '/monitoring/missing-updates' : null, { date });

  useEffect(() => {
    if (!monitorTick) return;
    void (tab === 'live' ? live.reload() : tab === 'logs' ? logs.reload() : tab === 'updates' ? updates.reload() : missing.reload());
  }, [monitorTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const filters = (
    <div className="flex flex-wrap items-end gap-3 border-b p-4">
      <Field label="Employee" className="w-60"><EmployeeSelect value={employeeId} onChange={setEmployeeId} /></Field>
      <Field label="From"><Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="w-40" /></Field>
      <Field label="To"><Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="w-40" /></Field>
      {(employeeId || from || to) && <button className="pb-2.5 text-sm text-primary hover:underline" onClick={() => { setEmployeeId(''); setFrom(''); setTo(''); }}>Clear filters</button>}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Employee monitoring"
        description="Live status, login/logout records, break durations and two-hour updates."
        actions={<Segmented value={tab} onChange={setTab} options={[{ value: 'live', label: 'Live' }, { value: 'logs', label: 'Activity logs' }, { value: 'updates', label: 'Work updates' }, { value: 'missing', label: 'Missing updates' }]} />}
      />
      <Card>
        {tab === 'live' && (
          live.loading && !live.data ? <TableSkeleton cols={7} /> : live.error ? <ErrorState message={live.error} onRetry={live.refetch} /> : (
            <>
              <div className="flex flex-wrap gap-2 border-b p-4">
                <Badge tone="success">{live.data.counts.working} working</Badge>
                <Badge tone="warning">{live.data.counts.onBreak} on break</Badge>
                <Badge tone="primary">{live.data.counts.completed} finished</Badge>
                <Badge>{live.data.counts.notStarted} not started</Badge>
              </div>
              <Table>
                <thead><tr><Th>Employee</Th><Th>Status</Th><Th>Started</Th><Th>Worked</Th><Th>Break</Th><Th>Updates</Th><Th>Next update</Th><Th>Last seen</Th></tr></thead>
                <tbody>
                  {live.data.rows.map((r: any) => (
                    <tr key={r.employee._id} className="hover:bg-muted/30">
                      <Td><Link to={`/admin/employees/${r.employee._id}`} className="font-medium hover:text-primary">{r.employee.name}</Link><p className="text-xs text-muted-foreground">{r.employee.department}</p></Td>
                      <Td><StatusBadge status={r.status} /></Td>
                      <Td>{r.startTime ? fmtTime(r.startTime) : '—'}</Td>
                      <Td className="tabular">{r.workedMs ? fmtDur(r.workedMs) : '—'}</Td>
                      <Td className="tabular">{r.breakMs ? fmtDur(r.breakMs) : '—'}</Td>
                      <Td className="tabular">{r.updatesCount}</Td>
                      <Td>{r.nextUpdateDue ? <span className={Date.parse(r.nextUpdateDue) < Date.now() ? 'font-medium text-destructive' : ''}>{fmtTime(r.nextUpdateDue)}</span> : '—'}</Td>
                      <Td className="text-muted-foreground">{r.lastHeartbeat ? fmtTime(r.lastHeartbeat) : '—'}</Td>
                    </tr>
                  ))}
                  {!live.data.rows.length && <tr><Td colSpan={8}><EmptyState title="No active employees" /></Td></tr>}
                </tbody>
              </Table>
            </>
          )
        )}
        {tab === 'logs' && (<>{filters}<SessionsTable data={logs.data} loading={logs.loading} error={logs.error} onRetry={logs.refetch} onPage={setPage} /></>)}
        {tab === 'updates' && (<>{filters}<UpdatesList data={updates.data} loading={updates.loading} error={updates.error} onRetry={updates.refetch} onPage={setPage} /></>)}
        {tab === 'missing' && (
          <>
            <div className="flex items-end gap-3 border-b p-4">
              <Field label="Date"><Input type="date" value={date} max={todayKey()} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-44" /></Field>
              <p className="pb-2.5 text-sm text-muted-foreground">Expected = one update per 2 hours of session time.</p>
            </div>
            {missing.loading && !missing.data ? <TableSkeleton cols={6} /> : missing.error ? <ErrorState message={missing.error} onRetry={missing.refetch} /> : !missing.data?.items.length ? (
              <EmptyState title="No missing updates" description="Everyone who worked this day submitted all required updates." />
            ) : (
              <Table>
                <thead><tr><Th>Employee</Th><Th>Session start</Th><Th>Expected</Th><Th>Submitted</Th><Th>Missing</Th><Th>Last update</Th><Th>State</Th></tr></thead>
                <tbody>
                  {missing.data.items.map((m: any) => (
                    <tr key={m.sessionId} className="hover:bg-muted/30">
                      <Td className="font-medium">{m.employee?.name}<p className="text-xs font-normal text-muted-foreground">{m.employee?.employeeId}</p></Td>
                      <Td>{fmtTime(m.startTime)}</Td>
                      <Td className="tabular">{m.expected}</Td>
                      <Td className="tabular">{m.submitted}</Td>
                      <Td><Badge tone="danger">{m.missing}</Badge></Td>
                      <Td>{m.lastUpdateAt ? fmtTime(m.lastUpdateAt) : 'Never'}</Td>
                      <Td>{m.overdue ? <Badge tone="danger">Overdue now</Badge> : <Badge tone="warning">Missed earlier</Badge>}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
