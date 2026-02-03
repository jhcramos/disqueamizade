import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Avatar, Badge } from '@/components/common'
import { mockRooms, mockUsers, mockMessages } from '@/data/mockRooms'

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
      <div className="min-h-screen bg-dark-bg text-gray-100 flex items-center justify-center">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">
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
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-surface/50 backdrop-blur-lg z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/rooms">
                <Button variant="ghost" size="sm">
                  ← Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {room.name}
                </h1>
                <p className="text-sm text-gray-400">{room.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-400">
                {room.online_count} online
              </div>
              <Badge tier="free">Modo Demo</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar - Users */}
        <aside className="w-64 border-r border-white/5 bg-surface/30 backdrop-blur-sm overflow-y-auto custom-scrollbar hidden md:block">
          <div className="p-4">
            <h3 className="text-lg font-bold text-primary-light mb-4">
              Participantes ({mockUsers.length})
            </h3>

            <div className="space-y-3">
              {mockUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface/50 transition-colors"
                >
                  <Avatar
                    src={user.avatar_url}
                    username={user.username}
                    size="sm"
                    status={user.is_online ? 'online' : 'offline'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {user.username}
                    </div>
                    <div className="flex gap-2 text-xs">
                      {user.video_enabled ? (
                        <span className="text-primary-light">📹</span>
                      ) : (
                        <span className="text-gray-600">📹</span>
                      )}
                      {user.audio_enabled ? (
                        <span className="text-primary-light">🎤</span>
                      ) : (
                        <span className="text-gray-600">🎤</span>
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
          <div className="border-b border-white/5 bg-surface/20 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-48">
              {mockUsers.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="aspect-video bg-surface rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden"
                >
                  {user.video_enabled ? (
                    <>
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full object-cover opacity-50"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-2 left-2 text-xs font-bold">
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
                      <div className="text-xs mt-2 text-gray-400">
                        {user.username}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <Avatar
                  src={msg.user.avatar_url}
                  username={msg.user.username}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-primary-light">
                      {msg.user.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-gray-300">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/5 bg-surface/30 backdrop-blur-sm p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="input-modern flex-1"
              />
              <Button type="submit" disabled={!message.trim()}>
                Enviar
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              💡 Modo demo - mensagens não são salvas
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
