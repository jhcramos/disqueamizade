import { create } from 'zustand'
import type { FichaPackage } from '@/types'

export const FICHA_PACKAGES: FichaPackage[] = [
  { id: 'stars_100', amount: 100, price: 'R$ 10,00', priceValue: 10, emoji: '⭐' },
  { id: 'stars_300', amount: 300, price: 'R$ 25,00', priceValue: 25, bonus: '+20% Bônus', bonusPercent: 20, emoji: '⭐' },
  { id: 'stars_650', amount: 650, price: 'R$ 50,00', priceValue: 50, bonus: '+30% Bônus', bonusPercent: 30, emoji: '⭐' },
  { id: 'stars_1400', amount: 1400, price: 'R$ 100,00', priceValue: 100, bonus: '+40% Bônus 🔥', bonusPercent: 40, popular: true, emoji: '🔥' },
  { id: 'stars_3750', amount: 3750, price: 'R$ 250,00', priceValue: 250, bonus: '+50% Bônus 🚀', bonusPercent: 50, emoji: '🚀' },
  { id: 'stars_8000', amount: 8000, price: 'R$ 500,00', priceValue: 500, bonus: '+60% Bônus 💎', bonusPercent: 60, emoji: '💎' },
  { id: 'stars_17000', amount: 17000, price: 'R$ 1.000,00', priceValue: 1000, bonus: '+70% Bônus 👑', bonusPercent: 70, emoji: '👑' },
]

interface FichaState {
  balance: number
  loading: boolean
  
  addStars: (amount: number) => void
  removeStars: (amount: number) => boolean
  purchasePackage: (packageId: string) => Promise<boolean>
  canAfford: (cost: number) => boolean
}

export const useFichaStore = create<FichaState>((set, get) => ({
  balance: 150,
  loading: false,

  addStars: (amount) => {
    set((state) => ({ balance: state.balance + amount }))
  },

  removeStars: (amount) => {
    const { balance } = get()
    if (balance < amount) return false
    set({ balance: balance - amount })
    return true
  },

  purchasePackage: async (packageId) => {
    const pkg = FICHA_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return false
    
    set({ loading: true })
    // In production, this would redirect to Stripe checkout
    // For demo, just add the stars
    await new Promise(resolve => setTimeout(resolve, 1000))
    get().addStars(pkg.amount)
    set({ loading: false })
    return true
  },

  canAfford: (cost) => get().balance >= cost,
}))
