import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Flame } from 'lucide-react'

const CATEGORY_ROOM_MAP: Record<string, { label: string; emoji: string; link: string; desc: string }> = {
  chat: { label: 'Sala Geral', emoji: '💬', link: '/rooms', desc: 'Bate-papo ao vivo com pessoas de todo o Brasil' },
  video: { label: 'Sala com Vídeo', emoji: '🎥', link: '/rooms', desc: 'Converse cara a cara com novas amizades' },
  cidades: { label: 'Salas por Cidade', emoji: '🏙️', link: '/rooms?category=cidade', desc: 'Encontre pessoas da sua cidade agora' },
  seguranca: { label: 'Sala Moderada', emoji: '🛡️', link: '/rooms', desc: 'Ambiente seguro e moderado para conversar' },
  dicas: { label: 'Sala Geral', emoji: '💡', link: '/rooms', desc: 'Coloque as dicas em prática agora' },
  relacionamento: { label: 'Sala Paquera', emoji: '💕', link: '/rooms', desc: 'Conheça pessoas especiais agora' },
  comparativo: { label: 'Salas Populares', emoji: '🔥', link: '/rooms', desc: 'Descubra por que somos a melhor opção' },
}

const DEFAULT_ROOM = { label: 'Salas de Chat', emoji: '💬', link: '/rooms', desc: 'Entre e conheça pessoas incríveis agora' }

interface BlogRoomCTAProps {
  category: string
  variant?: number
}

export const BlogRoomCTA = ({ category, variant = 0 }: BlogRoomCTAProps) => {
  const [onlineCount] = useState(() => Math.floor(Math.random() * 66) + 15)
  const room = CATEGORY_ROOM_MAP[category] || DEFAULT_ROOM

  const gradients = [
    'from-pink-600/20 to-purple-600/20',
    'from-cyan-600/20 to-blue-600/20',
    'from-amber-600/20 to-orange-600/20',
  ]
  const gradient = gradients[variant % gradients.length]

  return (
    <div className={`my-8 p-6 rounded-2xl bg-gradient-to-br ${gradient} border border-white/10 not-prose`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{room.emoji}</span>
        <div>
          <h4 className="text-lg font-bold text-white">{room.label}</h4>
          <p className="text-sm text-dark-400">{room.desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-orange-400" />
        <span className="text-sm text-orange-300 font-medium">
          {onlineCount} pessoas online agora
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      <Link
        to={room.link}
        className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-pink-500/25"
      >
        Entrar na Sala <ChevronRight className="w-5 h-5" />
      </Link>
    </div>
  )
}
