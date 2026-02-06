import {
  Button,
  Card,
  CardHeader,
  Badge,
  LevelBadge,
  VIPBadge,
  EliteBadge,
  StatusBadge,
  Avatar,
  AvatarGroup,
  VideoTile,
  VideoGrid,
  XPBar,
  MiniXP,
  PhaseIndicator,
  PhaseProgress,
  PhaseTimer,
  Modal,
} from '../components/design-system'
import { useState } from 'react'

export default function DesignSystemPage() {
  const [showModal, setShowModal] = useState(false)
  const [phase, setPhase] = useState<'pipoca' | 'cafe' | 'cachaca'>('pipoca')

  return (
    <div className="min-h-screen bg-noite-900 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-display-lg text-white mb-2">
          🎪 Design System
        </h1>
        <p className="text-noite-400 text-lg mb-12">
          Balada Digital — Moderno com toques retro Anos 90
        </p>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-white mb-6">Cores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <ColorSwatch name="Balada" color="bg-balada-500" hex="#FF6B35" />
            <ColorSwatch name="Festa" color="bg-festa-400" hex="#FFD166" />
            <ColorSwatch name="Energia" color="bg-energia-500" hex="#EF476F" />
            <ColorSwatch name="Conquista" color="bg-conquista-500" hex="#06D6A0" />
            <ColorSwatch name="Noite" color="bg-noite-900" hex="#1A1A2E" />
            <ColorSwatch name="Elite" color="bg-elite" hex="#DAA520" />
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-white mb-6">Botões</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="balada">Balada</Button>
            <Button variant="energia">Energia</Button>
            <Button variant="festa">Festa</Button>
            <Button variant="conquista">Conquista</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="elite">Elite ✨</Button>
            <Button variant="darkroom">Dark Room 🔥</Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button isLoading>Carregando...</Button>
            <Button disabled>Desabilitado</Button>
          </div>
        </section>

        {/* Badges */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-white mb-6">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge variant="balada">Balada</Badge>
            <Badge variant="energia">Energia</Badge>
            <Badge variant="festa">Festa</Badge>
            <Badge variant="conquista">Conquista</Badge>
            <Badge variant="neutral">Neutral</Badge>
            <VIPBadge />
            <EliteBadge />
            <LevelBadge level={7} title="Lenda" emoji="🏆" />
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <StatusBadge status="online" showLabel />
            <StatusBadge status="busy" showLabel />
            <StatusBadge status="offline" showLabel />
          </div>
        </section>

        {/* Avatars */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-white mb-6">Avatares</h2>
          <div className="flex flex-wrap items-end gap-4">
            <Avatar name="Maria Silva" size="xs" />
            <Avatar name="João Santos" size="sm" />
            <Avatar name="Ana Costa" size="md" showStatus isOnline />
            <Avatar name="Pedro Lima" size="lg" variant="vip" showStatus isOnline />
            <Avatar name="Julia Souza" size="xl" variant="elite" showStatus isOnline />
          </div>
          <div className="mt-6">
            <p className="text-sm text-noite-400 mb-2">Avatar Group:</p>
            <AvatarGroup
              avatars={[
                { name: 'Maria' },
                { name: 'João' },
                { name: 'Ana' },
                { name: 'Pedro' },
                { name: 'Julia' },
                { name: 'Lucas' },
              ]}
              max={4}
            />
          </div>
        </section>

        {/* Cards */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-white mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader title="Card Padrão" subtitle="Descrição opcional" />
              <p className="text-noite-400">Conteúdo do card aqui.</p>
            </Card>
            <Card variant="balada">
              <CardHeader title="Card Balada" subtitle="Hover com glow" />
              <p className="text-noite-400">Border laranja no hover.</p>
            </Card>
            <Card variant="elite">
              <CardHeader title="Card Elite" subtitle="Para VIPs" action={<EliteBadge />} />
              <p className="text-noite-400">Gradiente dourado.</p>
            </Card>
          </div>
        </section>

        {/* Phase Indicators */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-white mb-6">Fases da Conversa</h2>
          <div className="flex flex-wrap gap-4 mb-6">
            <PhaseIndicator currentPhase="pipoca" />
            <PhaseIndicator currentPhase="cafe" />
            <PhaseIndicator currentPhase="cachaca" />
          </div>
          <div className="mb-6">
            <p className="text-sm text-noite-400 mb-3">Progresso:</p>
            <PhaseProgress currentPhase={phase} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={phase === 'pipoca' ? 'festa' : 'ghost'} onClick={() => setPhase('pipoca')}>
              🍿 Pipoca
            </Button>
            <Button size="sm" variant={phase === 'cafe' ? 'balada' : 'ghost'} onClick={() => setPhase('cafe')}>
              ☕ Café
            </Button>
            <Button size="sm" variant={phase === 'cachaca' ? 'energia' : 'ghost'} onClick={() => setPhase('cachaca')}>
              🥃 Cachaça
            </Button>
          </div>
          <div className="mt-6">
            <PhaseTimer phase={phase} elapsedSeconds={342} minSeconds={300} />
          </div>
        </section>

        {/* XP System */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-white mb-6">Sistema de XP</h2>
          <div className="max-w-md space-y-4">
            <XPBar current={750} max={1000} level={5} levelTitle="Parceiro" />
            <XPBar current={250} max={300} level={2} levelTitle="Curioso" size="sm" />
            <XPBar current={4500} max={5000} level={6} levelTitle="Irmão" size="lg" />
          </div>
          <div className="flex gap-3 mt-6">
            <MiniXP level={5} emoji="⭐" />
            <MiniXP level={12} emoji="🏆" />
            <MiniXP level={3} emoji="🌱" />
          </div>
        </section>

        {/* Video Tiles */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-white mb-6">Video Tiles (Pista)</h2>
          <VideoGrid columns={4}>
            <VideoTile
              name="Maria Silva"
              tier="free"
              level={3}
              onFlashClick={() => console.log('flash')}
            />
            <VideoTile
              name="João Santos"
              tier="vip"
              level={7}
              isActive
              onFlashClick={() => console.log('flash')}
            />
            <VideoTile
              name="Ana Costa"
              tier="elite"
              level={12}
              onFlashClick={() => console.log('flash')}
            />
            <VideoTile
              name="Pedro Lima"
              tier="free"
              level={5}
              hasFlash
              onFlashClick={() => console.log('flash')}
            />
            <VideoTile
              name="Julia Souza"
              tier="vip"
              level={8}
              isMuted
              onFlashClick={() => console.log('flash')}
            />
            <VideoTile
              name="Lucas Oliveira"
              tier="free"
              level={2}
              isVideoOff
              onFlashClick={() => console.log('flash')}
            />
          </VideoGrid>
        </section>

        {/* Modal */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-white mb-6">Modal</h2>
          <Button onClick={() => setShowModal(true)}>Abrir Modal</Button>
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Exemplo de Modal"
            subtitle="Subtítulo opcional"
          >
            <p className="text-noite-300 mb-4">
              Este é o conteúdo do modal. Pode conter qualquer coisa.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowModal(false)}>Confirmar</Button>
            </div>
          </Modal>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-white mb-6">Tipografia</h2>
          <div className="space-y-4">
            <p className="font-display text-display-2xl text-white">Display 2XL</p>
            <p className="font-display text-display-xl text-white">Display XL</p>
            <p className="font-display text-display-lg text-white">Display LG</p>
            <p className="font-display text-display-md text-white">Display MD</p>
            <p className="font-display text-display-sm text-white">Display SM</p>
            <p className="text-xl text-white">Body XL (Inter)</p>
            <p className="text-base text-noite-300">Body Base — texto normal</p>
            <p className="text-sm text-noite-400">Body SM — descrições</p>
            <p className="text-gradient-balada font-display text-3xl font-bold">
              Texto com Gradiente Balada
            </p>
            <p className="ostentacao-name text-3xl">Nome com Ostentação ✨</p>
          </div>
        </section>
      </div>
    </div>
  )
}

// Helper component for color swatches
function ColorSwatch({ name, color, hex }: { name: string; color: string; hex: string }) {
  return (
    <div className="space-y-2">
      <div className={`w-full h-16 rounded-xl ${color}`} />
      <p className="text-sm font-medium text-white">{name}</p>
      <p className="text-xs text-noite-400 font-mono">{hex}</p>
    </div>
  )
}
