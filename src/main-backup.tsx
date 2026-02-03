import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { RoomsPage } from './pages/RoomsPage'
import { RoomPage } from './pages/RoomPage'
import { mockRooms } from './data/mockRooms'
import './styles/index.css'

const HomePage = () => (
  <div className="min-h-screen bg-dark-bg text-white">
    <header className="border-b border-neon-cyan/30 bg-dark-surface/50 p-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold text-neon-cyan">DISQUE AMIZADE</h1>
      </div>
    </header>

    <div className="container mx-auto px-4 py-16">
      <h1 className="text-5xl md:text-7xl font-bold text-glow-cyan mb-6 text-center">
        CONECTE-SE COM O
        <br />
        <span className="text-glow-magenta">FUTURO</span>
      </h1>

      <p className="text-xl text-gray-400 text-center mb-8">
        Plataforma de bate-papo com vídeo em grupo
      </p>

      <div className="flex justify-center gap-4">
        <Link to="/rooms" className="btn-neon">
          Entrar nas Salas
        </Link>
        <Link to="/pricing" className="btn-neon">
          Ver Planos
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <div className="glass-card p-8">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-2xl mb-3 text-neon-cyan">Salas de Chat</h3>
          <p className="text-gray-400">
            Entre em salas temáticas e conheça pessoas
          </p>
        </div>

        <div className="glass-card p-8">
          <div className="text-4xl mb-4">📹</div>
          <h3 className="text-2xl mb-3 text-neon-magenta">Vídeo em Grupo</h3>
          <p className="text-gray-400">
            Até 30 pessoas com vídeo em alta qualidade
          </p>
        </div>

        <div className="glass-card p-8">
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="text-2xl mb-3 text-neon-yellow">Marketplace</h3>
          <p className="text-gray-400">
            Ofereça ou contrate serviços
          </p>
        </div>
      </div>
    </div>
  </div>
)

const PricingPage = () => (
  <div className="min-h-screen bg-dark-bg text-white p-4">
    <div className="container mx-auto py-16">
      <h1 className="text-5xl font-bold text-glow-cyan mb-12 text-center">
        Planos e Preços
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="glass-card p-8 text-center">
          <div className="mb-4">
            <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm font-bold uppercase">
              ⚪ Free
            </span>
          </div>
          <h3 className="text-2xl font-bold mb-4">Plano Gratuito</h3>
          <div className="mb-6">
            <span className="text-5xl font-bold">R$ 0</span>
            <span className="text-gray-400">/mês</span>
          </div>
          <ul className="space-y-3 text-left text-sm mb-6">
            <li className="flex gap-2">
              <span className="text-neon-cyan">✓</span>
              <span>Acesso a salas públicas</span>
            </li>
            <li className="flex gap-2">
              <span className="text-neon-cyan">✓</span>
              <span>Chat ilimitado</span>
            </li>
            <li className="flex gap-2">
              <span className="text-neon-cyan">✓</span>
              <span>Transmitir vídeo</span>
            </li>
          </ul>
        </div>

        <div className="glass-card p-8 text-center border-2 border-neon-cyan">
          <div className="mb-4">
            <span className="bg-neon-cyan/20 text-neon-cyan px-3 py-1 rounded-full text-sm font-bold uppercase border border-neon-cyan/30">
              💎 Basic
            </span>
          </div>
          <h3 className="text-2xl font-bold mb-4">Plano Básico</h3>
          <div className="mb-6">
            <span className="text-5xl font-bold">R$ 19,90</span>
            <span className="text-gray-400">/mês</span>
          </div>
          <ul className="space-y-3 text-left text-sm mb-6">
            <li className="flex gap-2">
              <span className="text-neon-cyan">✓</span>
              <span>Tudo do FREE</span>
            </li>
            <li className="flex gap-2">
              <span className="text-neon-cyan">✓</span>
              <span>Máscaras virtuais</span>
            </li>
            <li className="flex gap-2">
              <span className="text-neon-cyan">✓</span>
              <span>Criar 3 salas</span>
            </li>
            <li className="flex gap-2">
              <span className="text-neon-cyan">✓</span>
              <span>Sem anúncios</span>
            </li>
          </ul>
        </div>

        <div className="glass-card p-8 text-center border-2 border-neon-magenta">
          <div className="mb-4">
            <span className="bg-neon-magenta/20 text-neon-magenta px-3 py-1 rounded-full text-sm font-bold uppercase border border-neon-magenta/30">
              👑 Premium
            </span>
          </div>
          <h3 className="text-2xl font-bold mb-4">Plano Premium</h3>
          <div className="mb-6">
            <span className="text-5xl font-bold">R$ 39,90</span>
            <span className="text-gray-400">/mês</span>
          </div>
          <ul className="space-y-3 text-left text-sm mb-6">
            <li className="flex gap-2">
              <span className="text-neon-magenta">✓</span>
              <span>Tudo do BASIC</span>
            </li>
            <li className="flex gap-2">
              <span className="text-neon-magenta">✓</span>
              <span>Máscaras 3D</span>
            </li>
            <li className="flex gap-2">
              <span className="text-neon-magenta">✓</span>
              <span>Salas ilimitadas</span>
            </li>
            <li className="flex gap-2">
              <span className="text-neon-magenta">✓</span>
              <span>Cabines secretas</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center mt-12">
        <Link to="/" className="btn-neon">
          Voltar ao Início
        </Link>
      </div>
    </div>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-bg text-white">
        <div className="fixed inset-0 pointer-events-none opacity-20">
          <div className="perspective-grid"></div>
        </div>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/debug" element={
            <div className="min-h-screen bg-dark-bg text-white p-8">
              <div className="glass-card p-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-neon-cyan mb-6">Debug Info</h1>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-neon-magenta mb-2">Mock Rooms ({mockRooms.length})</h2>
                    <pre className="bg-dark-surface p-4 rounded overflow-auto text-sm">
                      {JSON.stringify(mockRooms, null, 2)}
                    </pre>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <Link to="/" className="btn-neon">Início</Link>
                    <Link to="/rooms" className="btn-neon">Ver Salas</Link>
                  </div>
                </div>
              </div>
            </div>
          } />
          <Route path="*" element={
            <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
              <div className="glass-card p-8 text-center">
                <h1 className="text-3xl font-bold text-red-500 mb-4">404 - Página Não Encontrada</h1>
                <p className="text-gray-400 mb-6">A página que você procura não existe.</p>
                <Link to="/" className="btn-neon">Voltar ao Início</Link>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
