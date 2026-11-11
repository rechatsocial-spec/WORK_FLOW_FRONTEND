import axios from 'axios';

export const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 20_000 });

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // session expired / revoked: tell the app (login & me calls handle their own 401s)
    if (axios.isAxiosError(err) && err.response?.status === 401 && !err.config?.url?.startsWith('/auth/')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  },
);

export function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as any;
    if (d?.errors?.length) return d.errors.map((x: any) => (x.field ? `${x.field}: ${x.message}` : x.message)).join(' • ');
    if (d?.message) return d.message;
    if (!e.response) return 'Cannot reach the server. Check your internet connection.';
    return e.message;
  }
  return e instanceof Error ? e.message : 'Something went wrong';
}

/** the server attaches fresh state to 409 conflicts so the UI can resync */
export const conflictState = (e: unknown) => (axios.isAxiosError(e) && e.response?.status === 409 ? (e.response.data as any)?.details?.state : undefined);

export async function downloadFile(url: string, params: Record<string, unknown>, fallbackName: string) {
  const res = await api.get(url, { params, responseType: 'blob', timeout: 60_000 });
  let name = fallbackName;
  const cd = res.headers['content-disposition'] as string | undefined;
  const m = cd?.match(/filename="?([^"]+)"?/);
  if (m) name = m[1];
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}
