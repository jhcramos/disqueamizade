import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, MessageCircle, ChevronRight, Flame, Building2 } from 'lucide-react'
import { useAgeVerification } from '@/components/common/AgeVerificationModal'

type Tab = 'hot' | 'cidades' | 'geral'

interface QuickRoom {
  emoji: string
  name: string
  link: string
  online: number
  tabs: Tab[]
}

const ROOMS: QuickRoom[] = [
  { emoji: '💬', name: 'Bate-Papo Geral', link: '/rooms', online: 47, tabs: ['hot', 'geral'] },
  { emoji: '💕', name: 'Paquera & Amizade', link: '/rooms', online: 72, tabs: ['hot'] },
  { emoji: '🏙️', name: 'São Paulo', link: '/rooms?category=cidade', online: 63, tabs: ['hot', 'cidades'] },
  { emoji: '🌊', name: 'Rio de Janeiro', link: '/rooms?category=cidade', online: 55, tabs: ['cidades'] },
  { emoji: '🎮', name: 'Gamers BR', link: '/rooms', online: 38, tabs: ['geral'] },
  { emoji: '🍺', name: 'Bebida & Papo', link: '/rooms', online: 29, tabs: ['geral'] },
  { emoji: '🏖️', name: 'Salvador', link: '/rooms?category=cidade', online: 31, tabs: ['cidades'] },
  { emoji: '🌲', name: 'Curitiba', link: '/rooms?category=cidade', online: 22, tabs: ['cidades'] },
]

export const FloatingRoomPicker = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('hot')

  useEffect(() => {
    let timer: NodeJS.Timeout
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
      if (scrollPercent > 0.5) {
        setIsVisible(true)
        window.removeEventListener('scroll', handleScroll)
        clearTimeout(timer)
      }
    }

    timer = setTimeout(() => {
      setIsVisible(true)
      window.removeEventListener('scroll', handleScroll)
    }, 30000)

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timer)
    }
  }, [])

  const filteredRooms = ROOMS.filter(r => r.tabs.includes(activeTab)).slice(0, 5)

  if (!isVisible) return null

  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'hot', icon: <Flame className="w-3 h-3" />, label: 'Em Alta' },
    { key: 'cidades', icon: <Building2 className="w-3 h-3" />, label: 'Cidades' },
    { key: 'geral', icon: <MessageCircle className="w-3 h-3" />, label: 'Geral' },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-dark-900 rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="p-4 bg-gradient-to-r from-pink-600/30 to-purple-600/30 border-b border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">💬 Entrar numa Sala</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-dark-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1 mt-3">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/5 text-dark-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 max-h-64 overflow-y-auto">
            {filteredRooms.map(room => (
              <Link
                key={room.name}
                to={room.link}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <span className="text-xl">{room.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white group-hover:text-pink-400 transition-colors block truncate">
                    {room.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {room.online + Math.floor(Math.random() * 10)} online
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-600 group-hover:text-pink-400 transition-colors" />
              </Link>
            ))}
          </div>

          <Link
            to="/rooms"
            className="block p-3 text-center text-sm font-medium text-pink-400 hover:text-pink-300 hover:bg-white/5 border-t border-white/5 transition-colors"
          >
            Ver todas as salas →
          </Link>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg shadow-pink-500/30 flex items-center justify-center text-white text-2xl transition-all hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-dark-700 rotate-90' : 'bg-pink-500 hover:bg-pink-600 animate-bounce'
        }`}
        style={{ animationDuration: '3s', animationIterationCount: isOpen ? 0 : 'infinite' }}
      >
        {isOpen ? <X className="w-6 h-6" /> : '💬'}
      </button>
    </div>
  )
}
