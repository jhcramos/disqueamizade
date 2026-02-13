import { create } from 'zustand'
import { databaseService } from '@/services/supabase/database.service'
import { realtimeService } from '@/services/supabase/realtime.service'
import type { Notification } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  loading: boolean
  initialized: boolean
  _channel: RealtimeChannel | null

  setOpen: (open: boolean) => void
  toggle: () => void
  init: (userId: string) => Promise<void>
  cleanup: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  addToast: (title: string, message: string, type?: Notification['type']) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  loading: false,
  initialized: false,
  _channel: null,

  setOpen: (open) => set({ isOpen: open }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  // Initialize: fetch from Supabase + subscribe to realtime
  init: async (userId: string) => {
    if (get().initialized) return

    set({ loading: true })

    try {
      // Fetch existing notifications
      const data = await databaseService.getNotifications(userId)
      const notifications = (data || []) as Notification[]

      set({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        initialized: true,
        loading: false,
      })

      // Subscribe to new notifications in realtime
      const channel = realtimeService.subscribeToNotifications(userId, (newNotif: Notification) => {
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
          unreadCount: state.unreadCount + (newNotif.read ? 0 : 1),
        }))
      })

      set({ _channel: channel })
    } catch (err) {
      console.warn('Failed to load notifications:', err)
      set({ loading: false, initialized: true })
    }
  },

  // Cleanup realtime subscription
  cleanup: () => {
    const channel = get()._channel
    if (channel) {
      realtimeService.unsubscribe(channel)
    }
    set({ _channel: null, initialized: false, notifications: [], unreadCount: 0 })
  },

  // Add a local notification (also useful for in-app events)
  addNotification: (notification) => {
    const newNotif: Notification = {
      ...notification,
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
      unreadCount: state.unreadCount + (newNotif.read ? 0 : 1),
    }))
  },

  markAsRead: async (id) => {
    // Optimistic update
    set((state) => {
      const notifications = state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
      return {
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      }
    })

    // Persist to Supabase (ignore errors for local-only notifications)
    if (!id.startsWith('local-')) {
      try {
        await databaseService.markNotificationAsRead(id)
      } catch (err) {
        console.warn('Failed to mark notification as read:', err)
      }
    }
  },

  markAllAsRead: async () => {
    const userId = get().notifications[0]?.user_id
    
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }))

    // Persist to Supabase
    if (userId) {
      try {
        await databaseService.markAllNotificationsAsRead(userId)
      } catch (err) {
        console.warn('Failed to mark all notifications as read:', err)
      }
    }
  },

  removeNotification: (id) => {
    set((state) => {
      const notifications = state.notifications.filter(n => n.id !== id)
      return {
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      }
    })
  },

  addToast: (title, message, type = 'system') => {
    get().addNotification({
      user_id: 'me',
      type,
      title,
      message,
      read: false,
    })
  },
}))
