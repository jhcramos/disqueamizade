import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Badge,
  Avatar,
  VideoTile,
  VideoGrid,
} from '../components/design-system'

// Mock users for the Pista
interface PistaUser {
  id: string
  name: string
  avatarUrl?: string
  tier: 'free' | 'vip' | 'elite'
  level: number
  isOnline: boolean
  isMuted: boolean
  isVideoOff: boolean
  flashedMe: boolean
  iFlashed: boolean
  inCamarote: boolean
  camaroteName?: string
  camaroteId?: string
}

const generateMockUsers = (count: number): PistaUser[] => {
  const names = [
    'Maria Silva', 'João Santos', 'Ana Costa', 'Pedro Lima', 'Julia Souza',
    'Lucas Oliveira', 'Carla Mendes', 'Bruno Ferreira', 'Fernanda Alves', 'Ricardo Gomes',
    'Patrícia Dias', 'Marcos Ribeiro', 'Camila Rocha', 'Felipe Martins', 'Larissa Nunes',
    'Thiago Cardoso', 'Beatriz Moura', 'Gabriel Araújo', 'Amanda Correia', 'Vinicius Barbosa',
    'Isabela Castro', 'Diego Nascimento', 'Letícia Pereira', 'Rafael Carvalho', 'Mariana Teixeira',
    'Gustavo Pinto', 'Bianca Duarte', 'Leonardo Freitas', 'Natália Monteiro', 'Eduardo Vieira',
  ]
  
  const tiers: Array<'free' | 'vip' | 'elite'> = ['free', 'free', 'free', 'free', 'vip', 'vip', 'elite']
  
  const camarotes = [
    { id: 'cam1', name: 'Papo de Carros 🚗' },
    { id: 'cam2', name: 'Só +30 🍷' },
    { id: 'cam3', name: 'Gamers 🎮' },
  ]
  
  return names.slice(0, count).map((name, i) => {
    const inCamarote = Math.random() > 0.85 // ~15% em camarotes
    const camarote = inCamarote ? camarotes[Math.floor(Math.random() * camarotes.length)] : null
    
    return {
      id: `user-${i}`,
      name,
      tier: tiers[Math.floor(Math.random() * tiers.length)],
      level: Math.floor(Math.random() * 15) + 1,
      isOnline: true,
      isMuted: Math.random() > 0.8,
      isVideoOff: Math.random() > 0.85,
      flashedMe: Math.random() > 0.7,
      iFlashed: false,
      inCamarote,
      camaroteName: camarote?.name,
      camaroteId: camarote?.id,
    }
  })
}

export default function PistaPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<PistaUser[]>([])
  const [myFlashes, setMyFlashes] = useState<Set<string>>(new Set())
  const [roletaCountdown, setRoletaCountdown] = useState(300) // 5 minutes
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ user: string; text: string; tier: string }>>([
    { user: 'Maria Silva', text: 'Opa, salve galera! 🎉', tier: 'vip' },
    { user: 'João Santos', text: 'Bora que bora!', tier: 'free' },
    { user: 'Ana Costa', text: 'Primeira vez aqui, como funciona?', tier: 'free' },
  ])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    setUsers(generateMockUsers(24))
  }, [])

  // Roleta countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setRoletaCountdown(prev => {
        if (prev <= 1) {
          // Would trigger roleta
          return 300
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleFlash = (userId: string) => {
    setMyFlashes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
    
    // Update user state
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, iFlashed: !u.iFlashed } : u
    ))
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    setChatMessages(prev => [...prev, { user: 'Você', text: newMessage, tier: 'vip' }])
    setNewMessage('')
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const flashCount = users.filter(u => u.flashedMe).length
  const mutualFlashes = users.filter(u => u.flashedMe && myFlashes.has(u.id)).length

  return (
    <div className="min-h-screen bg-noite-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-noite-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back + Room info */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-display font-bold text-lg flex items-center gap-2">
                  🎪 Pista Principal
                  <Badge variant="conquista">{users.length} online</Badge>
                </h1>
                <p className="text-xs text-noite-400">Música • Geral</p>
              </div>
            </div>

            {/* Center: Roleta countdown */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-surface-light border border-balada-500/30">
              <span className="text-sm text-noite-400">Próxima Roleta</span>
              <span className="font-display font-bold text-xl text-balada-400">
                🎰 {formatTime(roletaCountdown)}
              </span>
            </div>

            {/* Right: Flash count + actions */}
            <div className="flex items-center gap-3">
              {flashCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-energia-500/20 border border-energia-500/30">
                  <span className="text-energia-400">⚡</span>
                  <span className="text-sm font-semibold text-energia-400">{flashCount} te mandaram Flash</span>
                </div>
              )}
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors relative"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-energia-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                  {chatMessages.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main content: Video Grid */}
        <main className={`flex-1 p-4 transition-all duration-300 ${chatOpen ? 'mr-80' : ''}`}>
          {/* Mobile roleta countdown */}
          <div className="md:hidden flex justify-center mb-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-surface-light border border-balada-500/30">
              <span className="text-sm text-noite-400">Próxima Roleta</span>
              <span className="font-display font-bold text-xl text-balada-400">
                🎰 {formatTime(roletaCountdown)}
              </span>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-noite-400 text-sm">Seus Flashes:</span>
              <Badge variant="energia">{myFlashes.size} enviados</Badge>
            </div>
            {mutualFlashes > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-noite-400 text-sm">Match mútuo:</span>
                <Badge variant="conquista">💕 {mutualFlashes}</Badge>
              </div>
            )}
          </div>

          {/* Video Grid */}
          <VideoGrid columns={6}>
            {users.map(user => (
              <VideoTile
                key={user.id}
                name={user.name}
                tier={user.tier}
                level={user.level}
                isMuted={user.isMuted}
                isVideoOff={user.isVideoOff}
                hasFlash={user.flashedMe && !myFlashes.has(user.id)}
                isActive={myFlashes.has(user.id) && user.flashedMe}
                inCamarote={user.inCamarote}
                camaroteName={user.camaroteName}
                camaroteId={user.camaroteId}
                onFlashClick={() => handleFlash(user.id)}
                onCamaroteClick={(camaroteId) => {
                  console.log('Entrar no camarote:', camaroteId)
                  // TODO: navigate to camarote
                }}
              >
                {/* Placeholder video - would be real video in production */}
                <div className="absolute inset-0 bg-gradient-to-br from-noite-800 to-noite-900">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar name={user.name} size="xl" variant={user.tier === 'elite' ? 'elite' : user.tier === 'vip' ? 'vip' : 'default'} />
                  </div>
                </div>
              </VideoTile>
            ))}
          </VideoGrid>

          {/* Bottom actions */}
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <Button variant="secondary" size="lg">
              🎤 Mic
            </Button>
            <Button variant="secondary" size="lg">
              📷 Câmera
            </Button>
            <Button variant="balada" size="lg">
              ⭐ Destaque (30 💎)
            </Button>
          </div>
        </main>

        {/* Chat sidebar */}
        <aside 
          className={`fixed right-0 top-[57px] bottom-0 w-80 bg-surface-light border-l border-white/5 flex flex-col transition-transform duration-300 ${
            chatOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-white/5">
            <h2 className="font-display font-bold">Chat da Pista</h2>
            <p className="text-xs text-noite-400">{users.length} pessoas online</p>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {chatMessages.map((msg, i) => (
              <div key={i} className="flex gap-2">
                <Avatar name={msg.user} size="sm" />
                <div>
                  <span className={`text-sm font-semibold ${msg.tier === 'elite' ? 'ostentacao-name' : msg.tier === 'vip' ? 'text-balada-400' : 'text-white'}`}>
                    {msg.user}
                  </span>
                  <p className="text-sm text-noite-300">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite sua mensagem..."
                className="input flex-1"
              />
              <Button onClick={handleSendMessage}>
                Enviar
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
