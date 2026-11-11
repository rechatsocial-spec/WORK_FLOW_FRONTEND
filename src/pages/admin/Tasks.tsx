import { Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import EmployeeSelect from '@/components/EmployeeSelect';
import { ConfirmDialog, Dialog } from '@/components/ui/dialog';
import { EmptyState, ErrorState, PageHeader, Pagination, PriorityBadge, SearchInput, StatusBadge, Table, TableSkeleton, Td, Th } from '@/components/ui/data';
import { Button, Card, Field, Input, Progress, Segmented, Select, Textarea } from '@/components/ui/primitives';
import { api, errMsg } from '@/lib/api';
import { useApi, useDebounced } from '@/lib/hooks';
import { cn, fmtDate, fmtDateTime } from '@/lib/utils';

const toLocalInput = (d?: string | Date) => {
  const x = d ? new Date(d) : new Date(Date.now() + 86_400_000);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};

function TaskForm({ initial, onDone, defaultEmployee }: { initial?: any; onDone: () => void; defaultEmployee?: string }) {
  const editing = !!initial;
  const [f, setF] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    assignedTo: initial?.assignedTo?._id ?? defaultEmployee ?? '',
    deadline: toLocalInput(initial?.deadline),
    priority: initial?.priority ?? 'medium',
    status: initial?.status ?? 'pending',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: any) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = { ...f, deadline: new Date(f.deadline).toISOString() };
      if (editing) await api.patch(`/tasks/${initial._id}`, body);
      else await api.post('/tasks', body);
      toast.success(editing ? 'Task updated' : 'Task assigned');
      onDone();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      <Field label="Title"><Input value={f.title} onChange={set('title')} required minLength={3} maxLength={200} /></Field>
      <Field label="Description"><Textarea value={f.description} onChange={set('description')} placeholder="Details, acceptance criteria, links…" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Assign to"><EmployeeSelect value={f.assignedTo} onChange={(v) => setF((p) => ({ ...p, assignedTo: v }))} allLabel="Select employee…" required /></Field>
        <Field label="Deadline"><Input type="datetime-local" value={f.deadline} onChange={set('deadline')} required /></Field>
        <Field label="Priority">
          <Select value={f.priority} onChange={set('priority')}>{['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}</Select>
        </Field>
        <Field label="Status">
          <Select value={f.status} onChange={set('status')}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></Select>
        </Field>
      </div>
      <Button type="submit" loading={busy} disabled={!f.assignedTo} className="w-full">{editing ? 'Save changes' : 'Assign task'}</Button>
    </form>
  );
}

export default function AdminTasks() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const dq = useDebounced(q);
  const { data, loading, error, refetch, reload } = useApi<any>('/tasks', { page, limit: 10, q: dq, status, priority, employeeId, sort: '-createdAt' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [del, setDel] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setPage(1), [dq, status, priority, employeeId]);

  async function doDelete() {
    setBusy(true);
    try {
      await api.delete(`/tasks/${del._id}`);
      toast.success('Task deleted');
      setDel(null);
      void reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Tasks" description="Assign, track and manage work for your team." actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Assign task</Button>} />
      <Card>
        <div className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Search tasks…" className="xl:w-72" />
          <Segmented value={status} onChange={setStatus} options={[{ value: '', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In progress' }, { value: 'completed', label: 'Completed' }]} />
          <div className="flex gap-3 xl:ml-auto">
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-36" aria-label="Priority">
              <option value="">All priorities</option>{['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            <EmployeeSelect value={employeeId} onChange={setEmployeeId} className="w-52" />
          </div>
        </div>
        {loading && !data ? <TableSkeleton cols={6} /> : error ? <ErrorState message={error} onRetry={refetch} /> : !data?.items.length ? (
          <EmptyState title="No tasks found" description="Assign a task to an employee to get started." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Assign task</Button>} />
        ) : (
          <>
            <Table>
              <thead><tr><Th>Task</Th><Th>Assignee</Th><Th>Priority</Th><Th>Status</Th><Th>Progress</Th><Th>Deadline</Th><Th className="text-right">Actions</Th></tr></thead>
              <tbody>
                {data.items.map((t: any) => {
                  const overdue = t.status !== 'completed' && Date.parse(t.deadline) < Date.now();
                  return (
                    <tr key={t._id} className="hover:bg-muted/30">
                      <Td className="max-w-xs"><p className="truncate font-medium">{t.title}</p><p className="text-xs text-muted-foreground">Assigned {fmtDate(t.assignedDate)}</p></Td>
                      <Td>{t.assignedTo?.name}<p className="text-xs text-muted-foreground">{t.assignedTo?.employeeId}</p></Td>
                      <Td><PriorityBadge priority={t.priority} /></Td>
                      <Td><StatusBadge status={t.status} /></Td>
                      <Td className="w-36"><div className="flex items-center gap-2"><Progress value={t.progress} className="flex-1" tone={t.status === 'completed' ? 'success' : 'primary'} /><span className="tabular text-xs">{t.progress}%</span></div></Td>
                      <Td className={cn('whitespace-nowrap', overdue && 'font-medium text-destructive')}>{fmtDateTime(t.deadline)}{overdue && <p className="text-xs">Overdue</p>}</Td>
                      <Td><div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Edit task" onClick={() => { setEditing(t); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" aria-label="Delete task" className="text-destructive" onClick={() => setDel(t)}><Trash2 className="h-4 w-4" /></Button>
                      </div></Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />
          </>
        )}
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Edit task' : 'Assign new task'} className="max-w-xl">
        {formOpen && <TaskForm initial={editing} defaultEmployee={employeeId} onDone={() => { setFormOpen(false); void reload(); }} />}
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} destructive loading={busy} title="Delete this task?" description={<>“{del?.title}” will be permanently removed. Past work updates that reference it are kept.</>} confirmLabel="Delete" onConfirm={doDelete} />
    </div>
  );
}

export { TaskForm };
