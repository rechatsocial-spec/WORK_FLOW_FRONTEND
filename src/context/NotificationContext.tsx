import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

export interface Notif {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotifCtx {
  items: Notif[];
  unread: number;
  /** increments whenever the server says live monitoring data changed */
  monitorTick: number;
  /** increments on any realtime notification – dashboards use it to refetch */
  notifTick: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAll: () => Promise<void>;
  connected: boolean;
}

const Ctx = createContext<NotifCtx>(null!);
export const useNotifications = () => useContext(Ctx);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [monitorTick, setMonitorTick] = useState(0);
  const [notifTick, setNotifTick] = useState(0);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await api.get('/notifications', { params: { limit: 8 } });
      setItems(r.data.items);
      setUnread(r.data.unreadCount);
    } catch {
      /* offline – keep what we have */
    }
  }, []);

  useEffect(() => {
    if (!user || user.mustChangePassword) return;
    void refresh();
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission();

    const socket = io({ withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      void refresh(); // catch up on anything missed while offline
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('notification', (n: Notif) => {
      setItems((prev) => [n, ...prev].slice(0, 8));
      setUnread((u) => u + 1);
      setNotifTick((t) => t + 1);
      const urgent = n.type === 'update_reminder' || n.type === 'missing_update' || n.type === 'deadline_approaching';
      (urgent ? toast.warning : toast.info)(n.title, { description: n.message, duration: urgent ? 10_000 : 5_000 });
      if (urgent && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
        new Notification(n.title, { body: n.message });
      }
    });
    socket.on('monitor:refresh', () => setMonitorTick((t) => t + 1));
    return () => {
      socket.disconnect();
      setConnected(false);
    };
  }, [user?.id, user?.mustChangePassword, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = useCallback(async (id: string) => {
    setItems((p) => p.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await api.patch(`/notifications/${id}/read`).catch(() => undefined);
  }, []);

  const markAll = useCallback(async () => {
    setItems((p) => p.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await api.post('/notifications/read-all').catch(() => undefined);
  }, []);

  return <Ctx.Provider value={{ items, unread, monitorTick, notifTick, refresh, markRead, markAll, connected }}>{children}</Ctx.Provider>;
}
