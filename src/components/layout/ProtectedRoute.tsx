import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui/primitives';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ role }: { role: 'admin' | 'employee' }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} state={{ from: loc.pathname }} replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  return <Outlet />;
}

/** login pages: bounce already-authenticated users to their dashboard */
export function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.mustChangePassword ? '/change-password' : user.role === 'admin' ? '/admin' : '/employee'} replace />;
  return <Outlet />;
}
