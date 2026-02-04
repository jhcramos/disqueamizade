import { create } from 'zustand'
import type { FichaPackage, LiveGift, SentGift } from '@/types'
import { OSTENTACAO_THRESHOLD } from '@/config/plans.config'

export const FICHA_PACKAGES: FichaPackage[] = [
  { id: 'fichas_50', amount: 50, price: 'R$ 9,90', priceValue: 9.90, emoji: '💰', perFicha: 'R$0,20' },
  { id: 'fichas_150', amount: 150, price: 'R$ 24,90', priceValue: 24.90, emoji: '💰', perFicha: 'R$0,17' },
  { id: 'fichas_500', amount: 500, price: 'R$ 69,90', priceValue: 69.90, bonus: '+50 bônus', bonusPercent: 10, popular: true, emoji: '🔥', perFicha: 'R$0,14' },
  { id: 'fichas_1500', amount: 1500, price: 'R$ 179,90', priceValue: 179.90, bonus: '+200 bônus', bonusPercent: 13, emoji: '💎', perFicha: 'R$0,12' },
  { id: 'fichas_3000', amount: 3000, price: 'R$ 349,90', priceValue: 349.90, bonus: '+500 bônus', bonusPercent: 17, emoji: '💎', perFicha: 'R$0,12' },
  { id: 'fichas_5000', amount: 5000, price: 'R$ 499,90', priceValue: 499.90, bonus: '+1000 bônus 🚀', bonusPercent: 20, emoji: '🚀', perFicha: 'R$0,10' },
  { id: 'fichas_10000', amount: 10000, price: 'R$ 899,90', priceValue: 899.90, bonus: '+2500 bônus 👑', bonusPercent: 25, emoji: '👑', perFicha: 'R$0,09' },
]

// ═══ Live Gifts ═══
export const LIVE_GIFTS: LiveGift[] = [
  { id: 'heart', name: 'Coração', emoji: '❤️', fichas_cost: 1, animation: 'float', rarity: 'common' },
  { id: 'rose', name: 'Rosa', emoji: '🌹', fichas_cost: 5, animation: 'bloom', rarity: 'common' },
  { id: 'star', name: 'Estrela', emoji: '⭐', fichas_cost: 10, animation: 'sparkle', rarity: 'common' },
  { id: 'fireworks', name: 'Fogos', emoji: '🎆', fichas_cost: 25, animation: 'fireworks', rarity: 'rare' },
  { id: 'diamond', name: 'Diamante', emoji: '💎', fichas_cost: 50, animation: 'rain', rarity: 'rare' },
  { id: 'rocket', name: 'Foguete', emoji: '🚀', fichas_cost: 100, animation: 'launch', rarity: 'epic' },
  { id: 'crown', name: 'Coroa', emoji: '👑', fichas_cost: 250, animation: 'crown', rarity: 'epic' },
  { id: 'trophy', name: 'Troféu', emoji: '🏆', fichas_cost: 500, animation: 'parade', rarity: 'legendary' },
  { id: 'fichas_rain', name: 'Chuva de Fichas', emoji: '💰', fichas_cost: 1000, animation: 'shower', rarity: 'legendary' },
]

interface FichaState {
  balance: number
  loading: boolean
  isOstentacao: boolean
  totalSpent: number
  totalEarned: number
  recentGifts: SentGift[]
  
  // Actions
  addFichas: (amount: number) => void
  removeFichas: (amount: number) => boolean
  purchasePackage: (packageId: string) => Promise<boolean>
  canAfford: (cost: number) => boolean
  sendGift: (gift: LiveGift, receiverId: string, roomId: string) => boolean
  checkOstentacao: () => boolean
  
  // Legacy aliases
  addStars: (amount: number) => void
  removeStars: (amount: number) => boolean
}

export const useFichaStore = create<FichaState>((set, get) => ({
  balance: 350, // Start with 350 so user is Ostentação by default in demo
  loading: false,
  isOstentacao: true,
  totalSpent: 0,
  totalEarned: 0,
  recentGifts: [],

  addFichas: (amount) => {
    set((state) => {
      const newBalance = state.balance + amount
      return { 
        balance: newBalance,
        totalEarned: state.totalEarned + amount,
        isOstentacao: newBalance >= OSTENTACAO_THRESHOLD,
      }
    })
  },

  removeFichas: (amount) => {
    const { balance } = get()
    if (balance < amount) return false
    set((state) => {
      const newBalance = state.balance - amount
      return { 
        balance: newBalance,
        totalSpent: state.totalSpent + amount,
        isOstentacao: newBalance >= OSTENTACAO_THRESHOLD,
      }
    })
    return true
  },

  purchasePackage: async (packageId) => {
    const pkg = FICHA_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return false
    
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 1000))
    get().addFichas(pkg.amount)
    set({ loading: false })
    return true
  },

  canAfford: (cost) => get().balance >= cost,

  sendGift: (gift, receiverId, roomId) => {
    const success = get().removeFichas(gift.fichas_cost)
    if (success) {
      const sentGift: SentGift = {
        id: `gift-${Date.now()}`,
        gift,
        sender: {
          id: 'current-user',
          username: 'Você',
          avatar_url: 'https://i.pravatar.cc/100?img=60',
          is_ostentacao: get().isOstentacao,
        },
        receiver_id: receiverId,
        room_id: roomId,
        created_at: new Date().toISOString(),
      }
      set((state) => ({
        recentGifts: [sentGift, ...state.recentGifts].slice(0, 50),
      }))
    }
    return success
  },

  checkOstentacao: () => get().balance >= OSTENTACAO_THRESHOLD,

  // Legacy aliases
  addStars: (amount) => get().addFichas(amount),
  removeStars: (amount) => get().removeFichas(amount),
}))
