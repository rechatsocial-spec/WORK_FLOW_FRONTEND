import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Field, Input } from '@/components/ui/primitives';
import { useAuth } from '@/context/AuthContext';
import { errMsg } from '@/lib/api';
import { AuthShell } from './AuthShell';

export default function Login({ portal }: { portal: 'admin' | 'employee' }) {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isAdmin = portal === 'admin';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(portal, email.trim(), password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}`);
      const from = (loc.state as any)?.from as string | undefined;
      nav(u.mustChangePassword ? '/change-password' : from && from.startsWith(isAdmin ? '/admin' : '/employee') ? from : isAdmin ? '/admin' : '/employee', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={isAdmin ? 'Admin sign in' : 'Employee sign in'}
      subtitle={isAdmin ? 'Authorized administrators only.' : 'Use the email and password provided by your administrator.'}
      footer={
        isAdmin ? (
          <Link to="/login" className="text-primary hover:underline">
            ← Employee login
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Administrator? <Link to="/admin/login" className="text-primary hover:underline">Sign in here</Link>
          </span>
        )
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <Field label="Email">
          <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required autoFocus />
        </Field>
        <Field label="Password">
          <div className="relative">
            <Input type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={busy} disabled={!email || !password}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
