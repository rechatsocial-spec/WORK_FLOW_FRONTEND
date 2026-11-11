import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Field, Input } from '@/components/ui/primitives';
import { useAuth } from '@/context/AuthContext';
import { api, errMsg } from '@/lib/api';
import { AuthShell } from './AuthShell';

/** shown right after the first login with an admin-generated password */
export default function ChangePassword() {
  const { user, setUser, logout, loading } = useAuth();
  const nav = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword) return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) return setError('Passwords do not match');
    setBusy(true);
    setError('');
    try {
      const r = await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      setUser(r.data.user);
      toast.success('Password updated');
      nav(r.data.user.role === 'admin' ? '/admin' : '/employee', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="For your security, replace the temporary password before continuing."
      footer={
        <button
          className="text-primary hover:underline"
          onClick={async () => {
            await logout();
            nav('/login');
          }}
        >
          Sign out
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        <Field label="Temporary password">
          <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoFocus />
        </Field>
        <Field label="New password" hint="Min 8 characters, with a letter and a number">
          <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={busy} disabled={!current || !next || !confirm}>
          Save and continue
        </Button>
      </form>
    </AuthShell>
  );
}
