import { ArrowLeft, Mail, Phone, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReportDownload from '@/components/ReportDownload';
import SessionsTable from '@/components/SessionsTable';
import UpdatesList from '@/components/UpdatesList';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, ErrorState, PriorityBadge, StatCard, StatusBadge, Table, Td, Th } from '@/components/ui/data';
import { Badge, Button, Card, CardHeader, CardTitle, Field, Input, Progress, Segmented, Skeleton } from '@/components/ui/primitives';
import { useApi } from '@/lib/hooks';
import { fmtDate, fmtDateTime, initials } from '@/lib/utils';
import { TaskForm } from './Tasks';
import { CheckCircle2, Clock, ListTodo, CalendarDays } from 'lucide-react';

export default function AdminEmployeeDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState<'activity' | 'updates' | 'tasks'>('activity');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [taskOpen, setTaskOpen] = useState(false);
  useEffect(() => setPage(1), [tab, from, to]);

  const emp = useApi<any>(`/employees/${id}`);
  const logs = useApi<any>(tab === 'activity' ? '/monitoring/sessions' : null, { employeeId: id, page, limit: 10, from, to });
  const updates = useApi<any>(tab === 'updates' ? '/updates' : null, { employeeId: id, page, limit: 6, from, to });
  const tasks = useApi<any>(tab === 'tasks' ? '/tasks' : null, { employeeId: id, all: 'true', sort: '-createdAt' });

  if (emp.error) return <Card><ErrorState message={emp.error} onRetry={emp.refetch} /></Card>;
  const e = emp.data?.employee;
  const s = emp.data?.stats;

  return (
    <div className="space-y-6">
      <Link to="/admin/employees" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All employees</Link>

      <Card className="p-6">
        {!e ? <Skeleton className="h-24" /> : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-xl font-semibold text-accent-foreground">{initials(e.name)}</div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold">{e.name}</h1><Badge tone={e.isActive ? 'success' : 'danger'}>{e.isActive ? 'Active' : 'Inactive'}</Badge></div>
                <p className="text-sm text-muted-foreground">{e.designation} · {e.department}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{e.email}</span>
                  {e.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{e.phone}</span>}
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4 lg:ml-auto">
              {[['Employee ID', e.employeeId], ['Joined', fmtDate(e.joiningDate)], ['Last login', e.lastLoginAt ? fmtDateTime(e.lastLoginAt) : 'Never'], ['Now']].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted-foreground">{k === 'Now' ? 'Current status' : k}</dt><dd className="font-medium">{k === 'Now' ? <StatusBadge status={s?.currentStatus ?? 'offline'} /> : v}</dd></div>
              ))}
            </dl>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Hours this month" value={`${s?.hoursThisMonth ?? 0}h`} icon={<Clock />} />
        <StatCard label="Days worked (month)" value={s?.daysWorkedThisMonth ?? 0} icon={<CalendarDays />} tone="info" />
        <StatCard label="Tasks completed" value={s?.tasks.completed ?? 0} icon={<CheckCircle2 />} tone="success" />
        <StatCard label="Open tasks" value={(s?.tasks.pending ?? 0) + (s?.tasks.in_progress ?? 0)} icon={<ListTodo />} tone="warning" />
      </div>

      <Card>
        <CardHeader className="flex-wrap">
          <div><CardTitle>Monthly report</CardTitle><p className="mt-1 text-xs text-muted-foreground">Download this employee’s timesheet.</p></div>
          <ReportDownload employeeId={id} />
        </CardHeader>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-end">
          <Segmented value={tab} onChange={setTab} options={[{ value: 'activity', label: 'Activity log' }, { value: 'updates', label: 'Work updates' }, { value: 'tasks', label: 'Tasks' }]} />
          {tab !== 'tasks' && (
            <div className="flex items-end gap-2 md:ml-auto">
              <Field label="From"><Input type="date" value={from} onChange={(x) => setFrom(x.target.value)} className="h-9 w-36" /></Field>
              <Field label="To"><Input type="date" value={to} onChange={(x) => setTo(x.target.value)} className="h-9 w-36" /></Field>
            </div>
          )}
          {tab === 'tasks' && <Button size="sm" className="md:ml-auto" onClick={() => setTaskOpen(true)}><Plus className="h-4 w-4" /> Assign task</Button>}
        </div>
        {tab === 'activity' && <SessionsTable data={logs.data} loading={logs.loading} error={logs.error} onRetry={logs.refetch} onPage={setPage} showEmployee={false} />}
        {tab === 'updates' && <UpdatesList data={updates.data} loading={updates.loading} error={updates.error} onRetry={updates.refetch} onPage={setPage} />}
        {tab === 'tasks' && (!tasks.data?.items.length ? <EmptyState title="No tasks assigned" /> : (
          <Table>
            <thead><tr><Th>Task</Th><Th>Priority</Th><Th>Status</Th><Th>Progress</Th><Th>Deadline</Th></tr></thead>
            <tbody>
              {tasks.data.items.map((t: any) => (
                <tr key={t._id}>
                  <Td className="font-medium">{t.title}</Td><Td><PriorityBadge priority={t.priority} /></Td><Td><StatusBadge status={t.status} /></Td>
                  <Td className="w-40"><div className="flex items-center gap-2"><Progress value={t.progress} className="flex-1" /><span className="text-xs">{t.progress}%</span></div></Td>
                  <Td>{fmtDateTime(t.deadline)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ))}
      </Card>

      <Dialog open={taskOpen} onOpenChange={setTaskOpen} title="Assign task" className="max-w-xl">
        {taskOpen && <TaskForm defaultEmployee={id} onDone={() => { setTaskOpen(false); void tasks.reload(); void emp.reload(); }} />}
      </Dialog>
    </div>
  );
}
