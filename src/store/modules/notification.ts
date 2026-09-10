import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppNotification } from '@/utils/notification'

/** 本地通知上限，超出裁掉最旧的 */
const NOTIFICATION_LIMIT = 50

interface NotificationState {
  notifications: AppNotification[]
  /** 新增一条通知（id/createdAt/read 由这里生成） */
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  resetState: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            { ...notification, id: crypto.randomUUID(), createdAt: Date.now(), read: false },
            ...state.notifications,
          ].slice(0, NOTIFICATION_LIMIT),
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id ? { ...item, read: true } : item
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, read: true })),
        })),
      clearNotifications: () => set({ notifications: [] }),
      resetState: () => set({ notifications: [] }),
    }),
    { name: 'notification-store' }
  )
)
