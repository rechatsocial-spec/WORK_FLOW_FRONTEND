import { Copy, Eye, KeyRound, Pencil, Plus, Power } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog, Dialog } from '@/components/ui/dialog';
import { EmptyState, ErrorState, PageHeader, Pagination, SearchInput, Table, TableSkeleton, Td, Th } from '@/components/ui/data';
import { Badge, Button, Card, Field, Input, Select } from '@/components/ui/primitives';
import { api, errMsg } from '@/lib/api';
import { useApi, useDebounced } from '@/lib/hooks';
import { fmtDate, fmtDateTime, initials } from '@/lib/utils';

const empty = { name: '', email: '', phone: '', designation: '', department: '', joiningDate: new Date().toLocaleDateString('en-CA') };

function EmployeeForm({ initial, onDone }: { initial?: any; onDone: (r: any) => void }) {
  const editing = !!initial;
  const [f, setF] = useState(
    initial ? { name: initial.name, email: initial.email, phone: initial.phone ?? '', designation: initial.designation, department: initial.department, joiningDate: initial.joiningDate?.slice(0, 10) } : empty,
  );
  const [password, setPassword] = useState('');
  const [mustChange, setMustChange] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof empty) => (e: any) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body: any = { ...f, phone: f.phone || undefined };
      if (!editing) {
        if (password) body.password = password;
        body.mustChangePassword = mustChange;
      }
      const r = editing ? await api.patch(`/employees/${initial.id}`, body) : await api.post('/employees', body);
      onDone(r.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><Input value={f.name} onChange={set('name')} required minLength={2} /></Field>
        <Field label="Email"><Input type="email" value={f.email} onChange={set('email')} required /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></Field>
        <Field label="Joining date"><Input type="date" value={f.joiningDate} onChange={set('joiningDate')} required /></Field>
        <Field label="Designation"><Input value={f.designation} onChange={set('designation')} required minLength={2} /></Field>
        <Field label="Department"><Input value={f.department} onChange={set('department')} required minLength={2} list="dept-list" /></Field>
      </div>
      {!editing && (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <Field label="Login password (optional)" hint="Type any simple password (min 4 characters), or leave blank to auto-generate a strong one.">
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} placeholder="e.g. welcome123" autoComplete="off" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            Require employee to change password at first login
          </label>
        </div>
      )}
      <Button type="submit" loading={busy} className="w-full">{editing ? 'Save changes' : 'Create employee'}</Button>
    </form>
  );
}

function CredentialsDialog({ creds, onClose }: { creds: { email: string; password: string } | null; onClose: () => void }) {
  const copy = async () => {
    await navigator.clipboard.writeText(`Email: ${creds!.email}\nPassword: ${creds!.password}`);
    toast.success('Credentials copied');
  };
  return (
    <Dialog open={!!creds} onOpenChange={(o) => !o && onClose()} title="Login credentials" description="Share these securely. The password is shown only once and cannot be retrieved later.">
      {creds && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border bg-muted/40 p-4 font-mono text-sm">
            <div className="flex justify-between gap-2"><span className="text-muted-foreground">Email</span><span className="break-all">{creds.email}</span></div>
            <div className="flex justify-between gap-2"><span className="text-muted-foreground">Password</span><span className="select-all font-semibold">{creds.password}</span></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={copy}><Copy className="h-4 w-4" /> Copy</Button>
            <Button className="flex-1" onClick={onClose}>Done</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

export default function AdminEmployees() {
  const nav = useNavigate();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const dq = useDebounced(q);
  const { data, loading, error, refetch, reload } = useApi<any>('/employees', { page, limit: 10, q: dq, status, department });
  const depts = useApi<any>('/employees/meta/departments');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [creds, setCreds] = useState<any>(null);
  const [toggle, setToggle] = useState<any>(null);
  const [reset, setReset] = useState<any>(null);
  const [resetPw, setResetPw] = useState('');
  const [resetForce, setResetForce] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => setPage(1), [dq, status, department]);

  async function doToggle() {
    setBusy(true);
    try {
      await api.patch(`/employees/${toggle.id}/status`, { isActive: !toggle.isActive });
      toast.success(`${toggle.name} ${toggle.isActive ? 'deactivated' : 'activated'}`);
      setToggle(null);
      void reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }
  async function doReset() {
    setBusy(true);
    try {
      const r = await api.post(`/employees/${reset.id}/reset-credentials`, { password: resetPw || undefined, mustChangePassword: resetForce });
      setReset(null);
      setResetPw('');
      setResetForce(true);
      setCreds(r.data.credentials);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Create accounts, manage access and view profiles."
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add employee</Button>}
      />
      <datalist id="dept-list">{(depts.data?.departments ?? []).map((d: string) => <option key={d} value={d} />)}</datalist>
      <Card>
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Search name, email, ID…" className="md:w-80" />
          <Select value={department} onChange={(e) => setDepartment(e.target.value)} className="md:ml-auto md:w-48" aria-label="Department">
            <option value="">All departments</option>
            {(depts.data?.departments ?? []).map((d: string) => <option key={d}>{d}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="md:w-40" aria-label="Status">
            <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </Select>
        </div>
        {loading && !data ? <TableSkeleton cols={6} /> : error ? <ErrorState message={error} onRetry={refetch} /> : !data?.items.length ? (
          <EmptyState title="No employees found" description="Create the first employee account to get started." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add employee</Button>} />
        ) : (
          <>
            <Table>
              <thead><tr><Th>Employee</Th><Th>ID</Th><Th>Department</Th><Th>Joined</Th><Th>Last login</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
              <tbody>
                {data.items.map((e: any) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{initials(e.name)}</div>
                        <div className="min-w-0"><Link to={`/admin/employees/${e.id}`} className="font-medium hover:text-primary">{e.name}</Link><p className="truncate text-xs text-muted-foreground">{e.email}</p></div>
                      </div>
                    </Td>
                    <Td className="tabular text-muted-foreground">{e.employeeId}</Td>
                    <Td>{e.department}<p className="text-xs text-muted-foreground">{e.designation}</p></Td>
                    <Td>{fmtDate(e.joiningDate)}</Td>
                    <Td className="text-muted-foreground">{e.lastLoginAt ? fmtDateTime(e.lastLoginAt) : 'Never'}</Td>
                    <Td><Badge tone={e.isActive ? 'success' : 'danger'}>{e.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="View" onClick={() => nav(`/admin/employees/${e.id}`)} aria-label="View profile"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => { setEditing(e); setFormOpen(true); }} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Reset credentials" onClick={() => setReset(e)} aria-label="Reset credentials"><KeyRound className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title={e.isActive ? 'Deactivate' : 'Activate'} onClick={() => setToggle(e)} aria-label={e.isActive ? 'Deactivate' : 'Activate'} className={e.isActive ? 'text-destructive' : 'text-success'}><Power className="h-4 w-4" /></Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />
          </>
        )}
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Edit employee' : 'Add employee'} className="max-w-xl">
        {formOpen && (
          <EmployeeForm
            initial={editing}
            onDone={(r) => {
              setFormOpen(false);
              void reload();
              void depts.reload();
              if (r.credentials) setCreds(r.credentials);
              else toast.success('Employee updated');
            }}
          />
        )}
      </Dialog>
      <CredentialsDialog creds={creds} onClose={() => setCreds(null)} />
      <ConfirmDialog open={!!toggle} onOpenChange={(o) => !o && setToggle(null)} loading={busy} destructive={toggle?.isActive} title={toggle?.isActive ? 'Deactivate account?' : 'Activate account?'} description={toggle?.isActive ? `${toggle?.name} will be signed out immediately and unable to log in.` : `${toggle?.name} will be able to log in again.`} confirmLabel={toggle?.isActive ? 'Deactivate' : 'Activate'} onConfirm={doToggle} />
      <Dialog open={!!reset} onOpenChange={(o) => !o && setReset(null)} title="Update login password" description={`Set a new password for ${reset?.name}. All their active sessions are signed out.`}>
        <div className="space-y-4">
          <Field label="New password (optional)" hint="Any simple password, min 4 characters. Leave blank to auto-generate a strong one.">
            <Input type="text" value={resetPw} onChange={(e) => setResetPw(e.target.value)} minLength={4} placeholder="e.g. welcome123" autoComplete="off" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={resetForce} onChange={(e) => setResetForce(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            Require change at next login
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReset(null)}>Cancel</Button>
            <Button loading={busy} disabled={!!resetPw && resetPw.length < 4} onClick={doReset}>Update password</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
