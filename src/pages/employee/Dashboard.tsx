import { AlertCircle, CalendarClock, Coffee, Clock, Hourglass, ListChecks, Pause, Play, Square, Target, TimerReset } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import UpdateForm from '@/components/UpdateForm';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState, PriorityBadge, StatCard, StatusBadge } from '@/components/ui/data';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Progress, Skeleton } from '@/components/ui/primitives';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { api, conflictState, errMsg } from '@/lib/api';
import { useApi, useNow, useOnline } from '@/lib/hooks';
import { cn, fmtClock, fmtDate, fmtDateTime, fmtDur, fmtTime } from '@/lib/utils';

interface TodayState {
  status: 'not_started' | 'active' | 'on_break' | 'completed';
  session: any | null;
  breaks: { startTime: string; endTime?: string }[];
  serverNow: string;
  targetMs: number;
  workedMs: number;
  breakMs: number;
  updatesToday: number;
  nextUpdateDue: string | null;
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { notifTick } = useNotifications();
  const online = useOnline();
  const now = useNow(1000);
  const [state, setState] = useState<TodayState | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [busy, setBusy] = useState<string>('');
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [summary, setSummary] = useState<TodayState | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const offset = useRef(0); // serverTime - clientTime, so the timer is right even if the laptop clock is off

  const apply = useCallback((s: TodayState) => {
    offset.current = Date.parse(s.serverNow) - Date.now();
    setState(s);
    setLoadErr('');
  }, []);

  const load = useCallback(async () => {
    try {
      apply((await api.get('/sessions/today')).data);
    } catch (e) {
      setLoadErr(errMsg(e));
    }
  }, [apply]);

  useEffect(() => void load(), [load, notifTick]);

  const open = state?.status === 'active' || state?.status === 'on_break';

  // heartbeat + recovery after disconnects / tab sleep
  useEffect(() => {
    if (!open) return;
    const beat = () => api.post('/sessions/heartbeat').then((r) => apply(r.data)).catch(() => undefined);
    const t = setInterval(beat, 60_000);
    const vis = () => !document.hidden && void load();
    window.addEventListener('online', load);
    document.addEventListener('visibilitychange', vis);
    return () => {
      clearInterval(t);
      window.removeEventListener('online', load);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [open, apply, load]);

  const live = useMemo(() => {
    if (!state?.session) return { worked: 0, brk: 0 };
    if (!open) return { worked: state.session.workedMs ?? state.workedMs, brk: state.session.breakMs ?? state.breakMs };
    const t = now + offset.current;
    const brk = state.breaks.reduce((s, b) => s + Math.max(0, (b.endTime ? Date.parse(b.endTime) : t) - Date.parse(b.startTime)), 0);
    return { worked: Math.max(0, t - Date.parse(state.session.startTime) - brk), brk };
  }, [state, now, open]);

  async function act(path: string, label: string) {
    setBusy(path);
    try {
      const r = await api.post(`/sessions/${path}`);
      apply(r.data);
      toast.success(label);
      if (path === 'end') setSummary(r.data);
      setConfirmEnd(false);
    } catch (e) {
      toast.error(errMsg(e));
      const st = conflictState(e);
      if (st) apply(st);
      else void load();
      setConfirmEnd(false);
    } finally {
      setBusy('');
    }
  }

  const tasks = useApi<any>('/tasks', { all: 'true', sort: 'deadline' }, [notifTick]);
  const updates = useApi<any>('/updates', { limit: 5 }, [notifTick]);

  const openTasks = (tasks.data?.items ?? []).filter((t: any) => t.status !== 'completed');
  const dueTasks = openTasks.filter((t: any) => Date.parse(t.deadline) - Date.now() < 7 * 86_400_000);
  const nowMs = now + offset.current;
  const updateDue = open && !!state?.nextUpdateDue && Date.parse(state.nextUpdateDue) <= nowMs;
  const pct = state ? Math.min(100, (live.worked / state.targetMs) * 100) : 0;
  const remaining = state ? Math.max(0, state.targetMs - live.worked) : 0;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.employee?.designation} · {user?.employee?.department}</p>
        </div>
        <div className="tabular text-sm text-muted-foreground sm:text-right">
          <p className="font-medium text-foreground">{new Date(now).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p>{new Date(now).toLocaleTimeString()}</p>
        </div>
      </div>

      {loadErr && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {loadErr}</span>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      )}
      {!online && open && <div className="rounded-lg bg-warning/15 px-4 py-2.5 text-sm text-warning">Connection lost — your session is safely tracked on the server. The timer will resync when you’re back online.</div>}

      {updateDue && (
        <div role="alert" className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <TimerReset className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium">Your 2-hour work update is due</p>
              <p className="text-sm text-muted-foreground">It was due at {fmtTime(state!.nextUpdateDue)}. Please submit it now.</p>
            </div>
          </div>
          <Button variant="warning" onClick={() => setUpdateOpen(true)}>Submit update</Button>
        </div>
      )}

      {/* Work session control */}
      <Card className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
          <div className="p-6">
            {!state ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Work session</p>
                  <StatusBadge status={state.status} />
                </div>
                <div className={cn('tabular text-5xl font-semibold tracking-tight sm:text-6xl', state.status === 'on_break' && 'text-warning')} aria-live="off">
                  {fmtClock(live.worked)}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {state.status === 'not_started' && 'Click Start Work to begin your day.'}
                  {state.status === 'active' && `Started at ${fmtTime(state.session.startTime)} · timer running`}
                  {state.status === 'on_break' && 'On break — timer paused. Resume when you’re back.'}
                  {state.status === 'completed' && `Ended at ${fmtTime(state.session.endTime)}${state.session.autoClosed ? ' (auto-closed)' : ''}`}
                </p>
                <div className="mt-5">
                  <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>{fmtDur(live.worked)} of {fmtDur(state.targetMs)}</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} tone={pct >= 100 ? 'success' : 'primary'} />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  {state.status === 'not_started' && (
                    <Button size="lg" variant="success" loading={busy === 'start'} onClick={() => act('start', 'Work session started')}>
                      <Play className="h-5 w-5" /> Start Work
                    </Button>
                  )}
                  {state.status === 'active' && (
                    <>
                      <Button size="lg" variant="warning" loading={busy === 'break/start'} onClick={() => act('break/start', 'Break started')}>
                        <Coffee className="h-5 w-5" /> Start Break
                      </Button>
                      <Button size="lg" variant="destructive" onClick={() => setConfirmEnd(true)}>
                        <Square className="h-5 w-5" /> End Work
                      </Button>
                    </>
                  )}
                  {state.status === 'on_break' && (
                    <>
                      <Button size="lg" variant="success" loading={busy === 'break/end'} onClick={() => act('break/end', 'Welcome back — work resumed')}>
                        <Play className="h-5 w-5" /> Resume Work
                      </Button>
                      <Button size="lg" variant="outline" onClick={() => setConfirmEnd(true)}>
                        <Square className="h-5 w-5" /> End Work
                      </Button>
                    </>
                  )}
                  {state.status === 'completed' && (
                    <Button size="lg" variant="outline" onClick={() => setSummary(state)}>View today’s summary</Button>
                  )}
                  {open && (
                    <Button size="lg" variant="outline" onClick={() => setUpdateOpen(true)}>Submit update</Button>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-px border-t bg-border lg:border-l lg:border-t-0">
            {[
              { icon: <Clock />, label: 'Working today', value: fmtDur(live.worked), tone: 'text-primary' },
              { icon: <Pause />, label: 'Break duration', value: fmtDur(live.brk), tone: 'text-warning' },
              { icon: <Hourglass />, label: 'Remaining (8h target)', value: state?.status === 'not_started' ? fmtDur(state.targetMs) : fmtDur(remaining), tone: 'text-success' },
              { icon: <CalendarClock />, label: 'Next update due', value: open && state?.nextUpdateDue ? fmtTime(state.nextUpdateDue) : '—', tone: updateDue ? 'text-destructive' : 'text-muted-foreground' },
            ].map((x) => (
              <div key={x.label} className="bg-card p-5">
                <div className={cn('mb-2 [&>svg]:h-5 [&>svg]:w-5', x.tone)}>{x.icon}</div>
                <p className="tabular text-xl font-semibold">{x.value}</p>
                <p className="text-xs text-muted-foreground">{x.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Updates submitted today" value={state?.updatesToday ?? 0} icon={<ListChecks />} tone="info" />
        <StatCard label="Open tasks" value={openTasks.length} icon={<Target />} />
        <StatCard label="Deadlines within 7 days" value={dueTasks.length} icon={<CalendarClock />} tone={dueTasks.length ? 'warning' : 'success'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assigned tasks</CardTitle>
            <Link to="/employee/tasks" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {tasks.loading && !tasks.data ? <Skeleton className="h-32" /> : !openTasks.length ? (
              <EmptyState title="No open tasks" description="New tasks from your admin appear here." />
            ) : (
              <ul className="divide-y">
                {openTasks.slice(0, 6).map((t: any) => {
                  const overdue = Date.parse(t.deadline) < Date.now();
                  return (
                    <li key={t._id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{t.title}</p>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <Progress value={t.progress} className="h-1.5 flex-1" />
                        <span className="tabular w-9 text-right text-xs text-muted-foreground">{t.progress}%</span>
                      </div>
                      <p className={cn('mt-1.5 text-xs', overdue ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                        {overdue ? 'Overdue · ' : 'Due '}{fmtDateTime(t.deadline)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Break history today</CardTitle>
              <Badge>{state?.breaks.length ?? 0}</Badge>
            </CardHeader>
            <CardContent>
              {!state?.breaks.length ? <p className="py-4 text-sm text-muted-foreground">No breaks taken yet.</p> : (
                <ul className="divide-y text-sm">
                  {state.breaks.map((b, i) => (
                    <li key={i} className="flex items-center justify-between py-2">
                      <span>{fmtTime(b.startTime)} → {b.endTime ? fmtTime(b.endTime) : <Badge tone="warning">ongoing</Badge>}</span>
                      <span className="tabular text-muted-foreground">{fmtDur((b.endTime ? Date.parse(b.endTime) : nowMs) - Date.parse(b.startTime))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previous work updates</CardTitle>
              <Link to="/employee/updates" className="text-xs text-primary hover:underline">History</Link>
            </CardHeader>
            <CardContent>
              {!updates.data?.items.length ? <p className="py-4 text-sm text-muted-foreground">No updates submitted yet.</p> : (
                <ul className="divide-y">
                  {updates.data.items.map((u: any) => (
                    <li key={u._id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{u.task?.title ?? 'General work'}</p>
                        <Badge tone="primary">{u.progress}%</Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{u.completedWork}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{fmtDateTime(u.submittedAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        title="End your work day?"
        description={<>You’ve worked <b>{fmtDur(live.worked)}</b> with <b>{fmtDur(live.brk)}</b> of breaks. This will record your logout time — it can’t be undone.</>}
        confirmLabel="End Work"
        destructive
        loading={busy === 'end'}
        onConfirm={() => act('end', 'Work session ended')}
      />

      <Dialog open={updateOpen} onOpenChange={setUpdateOpen} title="Submit work update" description="Report what you did in the last two hours.">
        <UpdateForm
          tasks={openTasks}
          disabledReason={open ? undefined : 'Start a work session before submitting updates.'}
          onDone={() => {
            setUpdateOpen(false);
            void load();
            void updates.reload();
            void tasks.reload();
          }}
        />
      </Dialog>

      <Dialog open={!!summary} onOpenChange={(o) => !o && setSummary(null)} title="Daily work summary" description={fmtDate(summary?.session?.startTime)}>
        {summary?.session && (
          <div className="space-y-3 text-sm">
            {[
              ['Start time', fmtTime(summary.session.startTime)],
              ['End time', fmtTime(summary.session.endTime)],
              ['Total active working time', fmtDur(summary.session.workedMs)],
              ['Break duration', `${fmtDur(summary.session.breakMs)} (${summary.breaks.length} break${summary.breaks.length === 1 ? '' : 's'})`],
              ['Updates submitted', String(summary.updatesToday)],
              ['Target (8h)', summary.session.workedMs >= summary.targetMs ? '✅ Achieved' : `Short by ${fmtDur(summary.targetMs - summary.session.workedMs)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b pb-2 last:border-0">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
            <Button className="mt-2 w-full" onClick={() => setSummary(null)}>Close</Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
