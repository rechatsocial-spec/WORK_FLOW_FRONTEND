import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/data';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Field, Input } from '@/components/ui/primitives';
import { useAuth } from '@/context/AuthContext';
import { api, errMsg } from '@/lib/api';
import { initials } from '@/lib/utils';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) return setError('Passwords do not match');
    setBusy(true);
    setError('');
    try {
      const r = await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      setUser(r.data.user);
      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success('Password changed. Other devices were signed out.');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Profile & security" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">{initials(user?.name)}</div>
              <div>
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Badge tone="primary" className="ml-auto capitalize">{user?.role}</Badge>
            </div>
            {user?.employee && (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[['Employee ID', user.employee.employeeId], ['Department', user.employee.department], ['Designation', user.employee.designation]].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {error && <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
              <Field label="Current password"><Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></Field>
              <Field label="New password" hint="Min 8 characters, with a letter and a number"><Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required /></Field>
              <Field label="Confirm new password"><Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></Field>
              <Button type="submit" loading={busy} disabled={!current || !next || !confirm}>Update password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
