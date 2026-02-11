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

/* Large centered PTT button — concave design, prominent center position */
export const PushToTalkLarge = ({ onTalkStart, onTalkEnd, enabled = true, disabled = false }: PushToTalkProps) => {
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
          relative w-20 h-20 sm:w-24 sm:h-24 rounded-full transition-all select-none touch-none
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}
          ${isTalking
            ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-[0_0_40px_rgba(236,72,153,0.6),inset_0_2px_4px_rgba(255,255,255,0.2)] scale-105'
            : 'bg-gradient-to-b from-dark-700 to-dark-900 text-dark-300 border-2 border-white/10 shadow-[inset_0_4px_12px_rgba(0,0,0,0.6),inset_0_-2px_4px_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_4px_12px_rgba(0,0,0,0.6),inset_0_-2px_4px_rgba(255,255,255,0.05),0_0_20px_rgba(236,72,153,0.2)]'
          }
        `}
      >
        {/* Concave inner shadow ring */}
        <span className={`absolute inset-[3px] rounded-full pointer-events-none ${
          isTalking 
            ? 'bg-gradient-to-b from-rose-400/20 to-transparent' 
            : 'bg-gradient-to-b from-black/30 to-transparent'
        }`} />
        
        {isTalking && (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-pink-400 animate-ping opacity-30" />
            <span className="absolute inset-[-8px] rounded-full border border-pink-500/20 animate-pulse" />
            <span className="absolute inset-[-16px] rounded-full border border-pink-500/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </>
        )}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {isTalking ? <Mic className="w-8 h-8 sm:w-10 sm:h-10" /> : <Radio className="w-8 h-8 sm:w-10 sm:h-10" />}
        </div>
      </button>
      <span className={`text-xs sm:text-sm font-semibold tracking-wide ${isTalking ? 'text-pink-400' : 'text-dark-500'}`}>
        {isTalking ? '🔊 Falando...' : 'Segure para falar'}
      </span>
    </div>
  )
}

/* Legacy alias */
export const PushToTalkMobile = PushToTalkLarge
