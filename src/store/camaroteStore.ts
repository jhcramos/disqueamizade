import { create } from 'zustand'

interface MinimizedParticipant {
  id: string
  username: string
  avatar: string
  videoEnabled: boolean
}

interface MinimizedCamarote {
  id: string
  name: string
  participants: MinimizedParticipant[]
}

interface CamaroteStore {
  minimizedCamarote: MinimizedCamarote | null
  minimizeCamarote: (camarote: MinimizedCamarote) => void
  clearMinimized: () => void
}

export const useCamaroteStore = create<CamaroteStore>((set) => ({
  minimizedCamarote: null,
  
  minimizeCamarote: (camarote) => set({ minimizedCamarote: camarote }),
  
  clearMinimized: () => set({ minimizedCamarote: null }),
}))
