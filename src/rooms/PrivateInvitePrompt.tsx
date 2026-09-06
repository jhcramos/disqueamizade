import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Mic, Video } from 'lucide-react'
import type { ContactMode, PrivateInvite } from './privateContact'

const modeCopy: Record<ContactMode, { label: string; Icon: typeof Video }> = {
  message: { label: 'conversar por mensagem', Icon: MessageCircle },
  audio: { label: 'conversar por áudio', Icon: Mic },
  video: { label: 'conversar por vídeo', Icon: Video },
}

export function PrivateInvitePrompt({ invite, fromName, working, onAccept, onDecline, onExpire }: {
  invite: PrivateInvite
  fromName: string
  working?: boolean
  onAccept: () => void
  onDecline: () => void
  onExpire: () => void
}) {
  const remaining = () => Math.max(0, Math.ceil((Date.parse(invite.expiresAt) - Date.now()) / 1000))
  const [seconds, setSeconds] = useState(remaining)
  const expireRef = useRef(onExpire)
  expireRef.current = onExpire
  useEffect(() => {
    setSeconds(remaining())
    const timer = window.setInterval(() => setSeconds(remaining()), 250)
    return () => window.clearInterval(timer)
  }, [invite.id, invite.expiresAt])
  useEffect(() => { if (seconds === 0) expireRef.current() }, [seconds])
  const { label, Icon } = modeCopy[invite.mode]

  return <div role="dialog" aria-modal="true" aria-labelledby="private-invite-title" className="fixed inset-x-3 top-16 z-[70] mx-auto max-w-sm rounded-2xl border border-primary-400/35 bg-dark-900 p-4 shadow-2xl shadow-black/50">
    <div className="flex gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-500/15 text-primary-300"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <h2 id="private-invite-title" className="font-bold">{fromName} quer {label}</h2>
        <p className="mt-1 text-xs text-dark-300">Só começa se você aceitar. {invite.mode === 'video' ? 'Você verá sua prévia antes de ligar a câmera.' : invite.mode === 'audio' ? 'Seu microfone começa desligado.' : 'A conversa será privada.'}</p>
      </div>
    </div>
    <div className="mt-4 flex gap-2">
      <button type="button" onClick={onDecline} disabled={working} className="flex-1 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-dark-200 disabled:opacity-50">Agora não</button>
      <button type="button" onClick={onAccept} disabled={working || seconds === 0} className="flex-1 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 px-3 py-2.5 text-sm font-bold disabled:opacity-50">{working ? 'Aguarde…' : `Aceitar · ${seconds}s`}</button>
    </div>
  </div>
}
