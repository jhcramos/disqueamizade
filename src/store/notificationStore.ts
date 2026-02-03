import { create } from 'zustand'
import type { Notification } from '@/types'

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    user_id: 'me',
    type: 'room_invite',
    title: 'Convite para Sala',
    message: 'ana_paula convidou você para "São Paulo #1"',
    read: false,
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'n2',
    user_id: 'me',
    type: 'game_invite',
    title: 'Casamento Atrás da Porta',
    message: 'Um novo jogo começou na sala "Geral Brasil"!',
    read: false,
    created_at: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 'n3',
    user_id: 'me',
    type: 'new_message',
    title: 'Nova Mensagem',
    message: 'joao_silva: E aí, bora jogar hoje?',
    read: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'n4',
    user_id: 'me',
    type: 'subscription_expiring',
    title: 'Assinatura Expirando',
    message: 'Sua assinatura Premium expira em 3 dias',
    read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  
  setOpen: (open: boolean) => void
  toggle: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  addToast: (title: string, message: string, type?: Notification['type']) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter(n => !n.read).length,
  isOpen: false,

  setOpen: (open) => set({ isOpen: open }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  addNotification: (notification) => {
    const newNotif: Notification = {
      ...notification,
      id: `n-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
      unreadCount: state.unreadCount + (newNotif.read ? 0 : 1),
    }))
  },

  markAsRead: (id) => {
    set((state) => {
      const notifications = state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
      return {
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      }
    })
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }))
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
