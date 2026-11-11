import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  mustChangePassword: boolean;
  employee: { id: string; employeeId: string; department: string; designation: string } | null;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (portal: 'admin' | 'employee', email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (u: AuthUser | null) => void;
}

const Ctx = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const expired = () => setUser(null);
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, []);

  const login = useCallback<AuthCtx['login']>(async (portal, email, password) => {
    const r = await api.post(portal === 'admin' ? '/auth/admin/login' : '/auth/login', { email, password });
    setUser(r.data.user);
    return r.data.user as AuthUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  return <Ctx.Provider value={{ user, loading, login, logout, setUser }}>{children}</Ctx.Provider>;
}
