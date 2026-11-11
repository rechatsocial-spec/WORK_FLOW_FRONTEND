import { Activity, CheckCircle2, Clock, Coffee, ListTodo, Percent, TimerReset, UserCheck, Users, Briefcase, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import EmployeeSelect from '@/components/EmployeeSelect';
import { EmptyState, ErrorState, PageHeader, StatCard, StatusBadge, Table, Td, Th } from '@/components/ui/data';
import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Segmented, Skeleton } from '@/components/ui/primitives';
import { useNotifications } from '@/context/NotificationContext';
import { useApi } from '@/lib/hooks';
import { fmtDur, fmtTime, todayKey } from '@/lib/utils';

const c = (n: number) => `hsl(var(--chart-${n}))`;
const axis = { stroke: 'hsl(var(--muted-foreground))', fontSize: 11, tickLine: false, axisLine: false } as const;
const tip = { contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }, cursor: { fill: 'hsl(var(--accent))', opacity: 0.5 } };
const shortDate = (d: string) => d.slice(5);

export default function AdminDashboard() {
  const { monitorTick } = useNotifications();
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [from, setFrom] = useState(todayKey());
  const [to, setTo] = useState(todayKey());
  const [employeeId, setEmployeeId] = useState('');
  const { data, loading, error, refetch, reload } = useApi<any>('/analytics/overview', { range, from: range === 'custom' ? from : '', to: range === 'custom' ? to : '', employeeId });
  const live = useApi<any>('/monitoring/live');
  const missing = useApi<any>('/monitoring/missing-updates');

  // realtime: refetch when a session/update changes
  useEffect(() => {
    if (!monitorTick) return;
    void reload();
    void live.reload();
    void missing.reload();
  }, [monitorTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const k = data?.cards;
  const ch = data?.charts;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={data ? `${data.range.from} → ${data.range.to}` : 'Workforce overview'} />

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Segmented value={range} onChange={setRange} options={[{ value: 'today', label: 'Today' }, { value: 'week', label: 'This week' }, { value: 'month', label: 'This month' }, { value: 'custom', label: 'Custom' }]} />
          {range === 'custom' && (
            <div className="flex items-center gap-2">
              <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" aria-label="From" />
              <span className="text-muted-foreground">→</span>
              <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" aria-label="To" />
            </div>
          )}
          <EmployeeSelect value={employeeId} onChange={setEmployeeId} className="lg:ml-auto lg:w-64" />
        </div>
      </Card>

      {error ? (
        <Card><ErrorState message={error} onRetry={refetch} /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {loading && !k ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
              <>
                <StatCard label="Total employees" value={k.totalEmployees} icon={<Users />} />
                <StatCard label="Active employees" value={k.activeEmployees} icon={<UserCheck />} tone="success" />
                <StatCard label="Working now" value={k.currentlyWorking} icon={<Activity />} tone="success" />
                <StatCard label="On break" value={k.onBreak} icon={<Coffee />} tone="warning" />
                <StatCard label="Attendance" value={`${k.attendancePct}%`} icon={<Percent />} tone="info" hint="of expected workdays" />
                <StatCard label="Total working hours" value={`${k.totalWorkedHours}h`} icon={<Clock />} />
                <StatCard label="Avg. hours / day" value={`${k.averageWorkedHours}h`} icon={<Timer />} tone="info" />
                <StatCard label="Tasks assigned" value={k.tasksAssigned} icon={<Briefcase />} />
                <StatCard label="Tasks completed" value={k.tasksCompleted} icon={<CheckCircle2 />} tone="success" />
                <StatCard label="Pending tasks" value={k.tasksPending} icon={<ListTodo />} tone="warning" />
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Working hours per day</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  {!ch ? <Skeleton className="h-full" /> : (
                    <ResponsiveContainer>
                      <AreaChart data={ch.dailyHours} margin={{ left: -16, right: 8 }}>
                        <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c(1)} stopOpacity={0.35} /><stop offset="95%" stopColor={c(1)} stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={shortDate} {...axis} />
                        <YAxis {...axis} />
                        <Tooltip {...tip} formatter={(v) => [`${v} h`, 'Hours']} />
                        <Area type="monotone" dataKey="hours" stroke={c(1)} strokeWidth={2} fill="url(#g1)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Task status</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  {!ch ? <Skeleton className="h-full" /> : ch.taskStatus.every((s: any) => !s.value) ? <EmptyState title="No tasks in range" /> : (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={ch.taskStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                          {ch.taskStatus.map((_: any, i: number) => <Cell key={i} fill={[c(3), c(5), c(2)][i]} />)}
                        </Pie>
                        <Tooltip {...tip} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Attendance trend (workdays)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-60">
                  {!ch ? <Skeleton className="h-full" /> : !ch.attendanceTrend.length ? <EmptyState title="No workdays in range" /> : (
                    <ResponsiveContainer>
                      <LineChart data={ch.attendanceTrend} margin={{ left: -16, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={shortDate} {...axis} />
                        <YAxis allowDecimals={false} {...axis} />
                        <Tooltip {...tip} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="present" name="Present" stroke={c(2)} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="expected" name="Expected" stroke={c(1)} strokeWidth={2} strokeDasharray="5 4" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Top employees by hours</CardTitle></CardHeader>
              <CardContent>
                <div className="h-60">
                  {!ch ? <Skeleton className="h-full" /> : !ch.topEmployees.length ? <EmptyState title="No sessions in range" /> : (
                    <ResponsiveContainer>
                      <BarChart data={ch.topEmployees} layout="vertical" margin={{ left: 8, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" {...axis} />
                        <YAxis type="category" dataKey="name" width={80} {...axis} />
                        <Tooltip {...tip} formatter={(v) => [`${v} h`, 'Hours']} />
                        <Bar dataKey="hours" fill={c(1)} radius={[0, 4, 4, 0]} barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Live status — today</CardTitle>
                <div className="flex gap-2 text-xs">
                  <Badge tone="success">{live.data?.counts.working ?? 0} working</Badge>
                  <Badge tone="warning">{live.data?.counts.onBreak ?? 0} break</Badge>
                  <Badge>{live.data?.counts.notStarted ?? 0} not started</Badge>
                </div>
              </CardHeader>
              {live.error ? <ErrorState message={live.error} onRetry={live.refetch} /> : (
                <Table>
                  <thead><tr><Th>Employee</Th><Th>Status</Th><Th>Started</Th><Th>Worked</Th><Th>Break</Th><Th>Updates</Th></tr></thead>
                  <tbody>
                    {(live.data?.rows ?? []).slice(0, 12).map((r: any) => (
                      <tr key={r.employee._id} className="hover:bg-muted/30">
                        <Td><Link to={`/admin/employees/${r.employee._id}`} className="font-medium hover:text-primary">{r.employee.name}</Link><p className="text-xs text-muted-foreground">{r.employee.department}</p></Td>
                        <Td><StatusBadge status={r.status} /></Td>
                        <Td>{r.startTime ? fmtTime(r.startTime) : '—'}</Td>
                        <Td className="tabular">{r.workedMs ? fmtDur(r.workedMs) : '—'}</Td>
                        <Td className="tabular">{r.breakMs ? fmtDur(r.breakMs) : '—'}</Td>
                        <Td className="tabular">{r.updatesCount}</Td>
                      </tr>
                    ))}
                    {live.data && !live.data.rows.length && <tr><Td colSpan={6}><EmptyState title="No active employees" /></Td></tr>}
                  </tbody>
                </Table>
              )}
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Missing updates</CardTitle>
                <Link to="/admin/monitoring" className="text-xs text-primary hover:underline">Details</Link>
              </CardHeader>
              <CardContent>
                {!missing.data?.items.length ? (
                  <div className="flex flex-col items-center py-8 text-center text-sm text-muted-foreground"><TimerReset className="mb-2 h-6 w-6 text-success" />Everyone is up to date</div>
                ) : (
                  <ul className="divide-y">
                    {missing.data.items.slice(0, 6).map((m: any) => (
                      <li key={m.sessionId} className="flex items-center justify-between gap-2 py-2.5">
                        <div className="min-w-0"><p className="truncate text-sm font-medium">{m.employee?.name}</p><p className="text-xs text-muted-foreground">{m.submitted}/{m.expected} submitted</p></div>
                        <Badge tone={m.overdue ? 'danger' : 'warning'}>{m.missing} missing</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
