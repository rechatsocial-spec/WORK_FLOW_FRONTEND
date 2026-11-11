import { MailCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Field, Input } from '@/components/ui/primitives';
import { api, errMsg } from '@/lib/api';
import { AuthShell } from './AuthShell';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Forgot password" subtitle="We’ll email you a link to reset it." footer={<Link to="/login" className="text-primary hover:underline">← Back to sign in</Link>}>
      {sent ? (
        <div className="rounded-lg border bg-card p-5 text-center">
          <MailCheck className="mx-auto mb-3 h-8 w-8 text-success" />
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-sm text-muted-foreground">If <b>{email}</b> is registered, a reset link has been sent. It expires in 1 hour.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@company.com" />
          </Field>
          <Button type="submit" className="w-full" size="lg" loading={busy} disabled={!email}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
