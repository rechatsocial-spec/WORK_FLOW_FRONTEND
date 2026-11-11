import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Field, Input } from '@/components/ui/primitives';
import { api, errMsg } from '@/lib/api';
import { AuthShell } from './AuthShell';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const portal = params.get('portal') === 'admin' ? '/admin/login' : '/login';
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match');
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password updated. Please sign in.');
      nav(portal, { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Set a new password" subtitle="Min 8 characters with at least one letter and one number." footer={<Link to={portal} className="text-primary hover:underline">← Back to sign in</Link>}>
      {!token ? (
        <p className="text-sm text-destructive">This reset link is missing its token. Request a new one.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <Field label="New password">
            <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
          </Field>
          <Field label="Confirm password">
            <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>
          <Button type="submit" className="w-full" size="lg" loading={busy} disabled={!password || !confirm}>
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
