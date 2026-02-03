import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Avatar, Badge } from '@/components/common'
import { mockRooms, mockUsers, mockMessages } from '@/data/mockRooms'
import { ArrowLeft, Send, Video, Mic, MicOff, Info } from 'lucide-react'

export const RoomPage = () => {
  const { roomId } = useParams()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(mockMessages)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const room = mockRooms.find((r) => r.id === roomId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const newMessage = {
      id: Date.now().toString(),
      user: mockUsers[0],
      content: message,
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setMessage('')
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-4">
            Sala não encontrada
          </h2>
          <Link to="/rooms">
            <Button>Voltar para Salas</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/rooms">
                <Button variant="ghost" size="sm" className="!px-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="border-l border-zinc-800 pl-3">
                <h1 className="text-base font-semibold text-zinc-50">
                  {room.name}
                </h1>
                <p className="text-xs text-zinc-500">{room.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {room.online_count} online
              </div>
              <Badge tier="free">Demo</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar - Users */}
        <aside className="w-64 border-r border-zinc-800/50 bg-zinc-900/30 overflow-y-auto custom-scrollbar hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
              Participantes ({mockUsers.length})
            </h3>

            <div className="space-y-1">
              {mockUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800/50 transition-colors"
                >
                  <Avatar
                    src={user.avatar_url}
                    username={user.username}
                    size="sm"
                    status={user.is_online ? 'online' : 'offline'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-zinc-300">
                      {user.username}
                    </div>
                    <div className="flex gap-2 text-xs">
                      {user.video_enabled ? (
                        <Video className="w-3 h-3 text-violet-400" />
                      ) : (
                        <Video className="w-3 h-3 text-zinc-700" />
                      )}
                      {user.audio_enabled ? (
                        <Mic className="w-3 h-3 text-violet-400" />
                      ) : (
                        <MicOff className="w-3 h-3 text-zinc-700" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Video Grid Placeholder */}
          <div className="border-b border-zinc-800/50 bg-zinc-900/20 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48">
              {mockUsers.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="aspect-video bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center relative overflow-hidden"
                >
                  {user.video_enabled ? (
                    <>
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full object-cover opacity-50"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-2 left-2 text-xs font-medium text-zinc-300">
                        {user.username}
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <Avatar
                        src={user.avatar_url}
                        username={user.username}
                        size="md"
                      />
                      <div className="text-xs mt-2 text-zinc-500">
                        {user.username}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3 group hover:bg-zinc-900/30 rounded-xl p-2 -mx-2 transition-colors">
                <Avatar
                  src={msg.user.avatar_url}
                  username={msg.user.username}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-medium text-sm text-zinc-200">
                      {msg.user.username}
                    </span>
                    <span className="text-[11px] text-zinc-600">
                      {msg.timestamp.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800/50 bg-zinc-900/30 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="input-modern flex-1"
              />
              <Button type="submit" disabled={!message.trim()} className="!px-4">
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <div className="flex items-center gap-1.5 mt-2">
              <Info className="w-3 h-3 text-zinc-600" />
              <p className="text-[11px] text-zinc-600">
                Modo demo — mensagens não são salvas
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
