import { Radio, Mic } from 'lucide-react'
import { usePushToTalk } from '@/hooks/usePushToTalk'

interface PushToTalkProps {
  onTalkStart?: () => void
  onTalkEnd?: () => void
  enabled?: boolean
  disabled?: boolean
}

export const PushToTalk = ({ onTalkStart, onTalkEnd, enabled = true, disabled = false }: PushToTalkProps) => {
  const { isTalking, holdToTalk, releaseTalk } = usePushToTalk({
    onTalkStart,
    onTalkEnd,
    enabled: enabled && !disabled,
  })

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onMouseDown={holdToTalk}
        onMouseUp={releaseTalk}
        onMouseLeave={releaseTalk}
        onTouchStart={(e) => { e.preventDefault(); holdToTalk() }}
        onTouchEnd={(e) => { e.preventDefault(); releaseTalk() }}
        onTouchCancel={releaseTalk}
        disabled={disabled}
        className={`
          relative p-3 sm:p-4 rounded-2xl transition-all select-none touch-none
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          ${isTalking
            ? 'bg-pink-500/30 text-pink-300 border-2 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.4)] scale-105'
            : 'bg-white/[0.06] text-dark-400 border-2 border-white/10 hover:bg-white/[0.1] hover:text-white'
          }
        `}
        title={disabled ? 'Crie uma conta para usar o microfone' : 'Segure para falar (ou Espaço)'}
      >
        {/* Pulse rings when talking */}
        {isTalking && (
          <>
            <span className="absolute inset-0 rounded-2xl border-2 border-pink-400 animate-ping opacity-30" />
            <span className="absolute inset-[-4px] rounded-2xl border border-pink-500/20 animate-pulse" />
          </>
        )}
        {isTalking ? <Mic className="w-5 h-5 relative z-10" /> : <Radio className="w-5 h-5 relative z-10" />}
      </button>
      <span className={`text-[10px] font-medium transition-colors hidden sm:block ${isTalking ? 'text-pink-400' : 'text-dark-500'}`}>
        {isTalking ? 'Falando...' : 'Segure p/ falar'}
      </span>
    </div>
  )
}

/* Large mobile PTT button for bottom of screen */
export const PushToTalkMobile = ({ onTalkStart, onTalkEnd, enabled = true, disabled = false }: PushToTalkProps) => {
  const { isTalking, holdToTalk, releaseTalk } = usePushToTalk({
    onTalkStart,
    onTalkEnd,
    enabled: enabled && !disabled,
  })

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onTouchStart={(e) => { e.preventDefault(); holdToTalk() }}
        onTouchEnd={(e) => { e.preventDefault(); releaseTalk() }}
        onTouchCancel={releaseTalk}
        onMouseDown={holdToTalk}
        onMouseUp={releaseTalk}
        onMouseLeave={releaseTalk}
        disabled={disabled}
        className={`
          relative w-16 h-16 rounded-full transition-all select-none touch-none
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          ${isTalking
            ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-[0_0_30px_rgba(236,72,153,0.5)] scale-110'
            : 'bg-dark-800 text-dark-400 border-2 border-white/10'
          }
        `}
      >
        {isTalking && (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-pink-400 animate-ping opacity-30" />
            <span className="absolute inset-[-6px] rounded-full border border-pink-500/20 animate-pulse" />
          </>
        )}
        {isTalking ? <Mic className="w-7 h-7 mx-auto relative z-10" /> : <Radio className="w-7 h-7 mx-auto relative z-10" />}
      </button>
      <span className={`text-xs font-medium ${isTalking ? 'text-pink-400' : 'text-dark-500'}`}>
        {isTalking ? '🔊 Falando...' : 'Segure para falar'}
      </span>
    </div>
  )
}
