import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errMsg } from './api';

/** GET helper with loading/error state; refetches whenever url/params/deps change */
export function useApi<T = any>(url: string | null, params?: Record<string, unknown>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const key = JSON.stringify(params ?? {});

  const load = useCallback(
    async (silent = false) => {
      if (!url) return;
      const id = ++seq.current;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const clean = Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== '' && v !== undefined && v !== null));
        const res = await api.get<T>(url, { params: clean });
        if (id === seq.current) setData(res.data);
      } catch (e) {
        if (id === seq.current) setError(errMsg(e));
      } finally {
        if (id === seq.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, key],
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, ...deps]);

  return { data, loading, error, reload: () => load(true), refetch: () => load(false) };
}

export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** ticking clock; `ms` precision */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
