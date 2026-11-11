import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));

export const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtTime = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtDateTime = (d?: string | Date | null) => (d ? `${fmtDate(d)}, ${fmtTime(d)}` : '—');

/** 3723000 → "1h 02m" */
export function fmtDur(ms: number) {
  const m = Math.max(0, Math.round(ms / 60_000));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}
/** 3723000 → "01:02:03" (live timers) */
export function fmtClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
}

export const todayKey = () => new Date().toLocaleDateString('en-CA');
export const monthKey = (d = new Date()) => d.toLocaleDateString('en-CA').slice(0, 7);

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export function timeAgo(d: string | Date) {
  const s = Math.floor((Date.now() - +new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return fmtDate(d);
}
