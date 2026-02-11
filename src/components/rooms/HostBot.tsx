import type { BotMessage } from '@/hooks/useHostBot'

interface HostBotMessageProps {
  message: BotMessage
  onCompleteProfile?: () => void
}

export const HostBotMessage = ({ message, onCompleteProfile }: HostBotMessageProps) => {
  const hasProfileLink = message.content.includes('[📝 Completar Perfil]')
  const displayContent = message.content.replace('[📝 Completar Perfil]', '')

  return (
    <div className="flex gap-2.5">
      {/* Bot Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-lg ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/20">
          🎺
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {/* Name with crown badge */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
            👑 Arauto
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              BOT
            </span>
          </span>
          <span className="text-[10px] text-dark-600">
            {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {/* Message with gold/amber styling */}
        <div className="inline-block px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] bg-amber-500/5 border-l-2 border-amber-500/30 text-sm text-amber-100/90 whitespace-pre-line leading-relaxed">
          {displayContent}
          {hasProfileLink && onCompleteProfile && (
            <button
              onClick={onCompleteProfile}
              className="mt-2 block px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all text-xs font-bold"
            >
              📝 Completar Perfil
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default HostBotMessage
