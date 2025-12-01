import { create } from 'zustand';
import { api } from '../services/api';

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsState {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  fetchUnreadCount: () => Promise<void>;
  fetchNotifications: (limit?: number) => Promise<void>;
  markRead: (ids?: string[]) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,

  fetchUnreadCount: async () => {
    try {
      const r = await api.get('/notifications/unread-count');
      set({ unreadCount: r.data.count ?? 0 });
    } catch {}
  },

  fetchNotifications: async (limit = 50) => {
    set({ loading: true });
    try {
      const r = await api.get('/notifications', { params: { limit } });
      set({ items: r.data || [] });
    } catch {
      set({ items: [] });
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (ids?: string[]) => {
    try {
      await api.post('/notifications/mark-read', { ids });
      // Atualizar estado local
      const updated = get().items.map(i => ids && ids.includes(i.id) ? { ...i, isRead: true } : i);
      const newUnread = updated.filter(i => !i.isRead).length;
      set({ items: updated, unreadCount: newUnread });
    } catch {}
  }
}));
