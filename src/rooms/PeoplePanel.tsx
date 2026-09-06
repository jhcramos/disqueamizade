import { useMemo, useState } from 'react'
import { MessageCircle, Mic, Video, VideoOff } from 'lucide-react'
import type { ContactPreferences, RoomPresence } from '@/services/supabase/roomChat'
import type { ContactMode } from './privateContact'

type Props = {
  people: RoomPresence[]
  selfId: string
  cameraLiveIds: Set<string>
  preferences: ContactPreferences
  saving?: boolean
  busy?: boolean
  onPreferences: (preferences: ContactPreferences) => void
  onInvite: (person: RoomPresence, mode: ContactMode) => void
}

const modes: { key: ContactMode; label: string; Icon: typeof Video }[] = [
  { key: 'message', label: 'Mensagem', Icon: MessageCircle },
  { key: 'audio', label: 'Áudio', Icon: Mic },
  { key: 'video', label: 'Vídeo', Icon: Video },
]

export function PeoplePanel({ people, selfId, cameraLiveIds, preferences, saving, busy, onPreferences, onInvite }: Props) {
  const [calling, setCalling] = useState<string | null>(null)
  const sorted = useMemo(() => [...people].sort((a, b) => {
    if (a.userId === selfId) return -1
    if (b.userId === selfId) return 1
    return a.joinedAt - b.joinedAt
  }), [people, selfId])

  return <div className="flex min-h-0 flex-1 flex-col">
    <section className="border-b border-white/5 p-3">
      <h2 className="text-sm font-bold">Como podem falar comigo hoje?</h2>
      <p className="mt-1 text-[11px] leading-4 text-dark-400">Você sempre decide se aceita cada convite. Câmera e microfone começam desligados.</p>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {modes.map(({ key, label, Icon }) => <button
          key={key}
          type="button"
          role="switch"
          aria-checked={preferences[key]}
          disabled={saving || busy}
          onClick={() => onPreferences({ ...preferences, [key]: !preferences[key] })}
          className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-1 text-xs font-semibold transition ${preferences[key] ? 'border-primary-400/50 bg-primary-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-dark-400'} disabled:opacity-50`}
        ><Icon className="h-4 w-4" />{label}</button>)}
      </div>
    </section>

    <div className="flex-1 space-y-2 overflow-y-auto p-3">
      {sorted.map(person => {
        const isSelf = person.userId === selfId
        const cameraOn = cameraLiveIds.has(person.userId)
        const available = modes.filter(mode => person.preferences[mode.key])
        return <article key={person.userId} className="rounded-2xl border border-white/5 bg-white/[0.025] p-3">
          <div className="flex items-start gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-500/30 to-pink-500/30 font-bold">{person.username.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold">{person.username}</span>
                {isSelf && <span className="text-[10px] text-dark-400">você</span>}
              </div>
              <div className="mt-1 flex flex-wrap gap-1" aria-label={`Disponibilidade de ${person.username}`}>
                {cameraOn
                  ? <span title="Câmera ligada agora" className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300"><Video className="h-3 w-3" /> ao vivo</span>
                  : <span title="Câmera desligada" className="flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-dark-500"><VideoOff className="h-3 w-3" /></span>}
                {available.map(({ key, label, Icon }) => <span key={key} title={`Aceita ${label.toLowerCase()}`} className="flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-dark-300"><Icon className="h-3 w-3" /> {label}</span>)}
                {person.busy && <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-200">ocupado</span>}
              </div>
            </div>
            {!isSelf && <button type="button" disabled={person.busy || busy || available.length === 0} onClick={() => setCalling(current => current === person.userId ? null : person.userId)} className="rounded-xl bg-primary-500 px-3 py-2 text-xs font-bold hover:bg-primary-400 disabled:bg-white/5 disabled:text-dark-500">Chamar</button>}
          </div>
          {calling === person.userId && !person.busy && <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/5 pt-2">
            {available.map(({ key, label, Icon }) => <button key={key} type="button" onClick={() => { setCalling(null); onInvite(person, key) }} className="flex items-center gap-1.5 rounded-xl border border-primary-400/30 bg-primary-500/10 px-2.5 py-2 text-xs font-semibold text-primary-100"><Icon className="h-3.5 w-3.5" />{label}</button>)}
          </div>}
        </article>
      })}
      {sorted.length === 0 && <p className="px-2 py-6 text-center text-sm text-dark-400">Ainda não há ninguém visível na sala.</p>}
    </div>
  </div>
}
