# Disque Amizade

Plataforma de bate-papo com vídeo em grupo, salas temáticas, gamificação e marketplace de talentos.

## Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS (design Tron/Anos 80 futurista)
- **Backend/Database**: Supabase (Auth, PostgreSQL, Realtime, Storage)
- **Vídeo**: LiveKit (open source + cloud managed)
- **Filtros de Vídeo**: Google MediaPipe
- **Pagamentos**: Stripe
- **State Management**: Zustand
- **Data Fetching**: React Query

## Features Principais

1. **Salas de Chat com Vídeo**
   - Até 30 usuários simultâneos por sala
   - Chat de texto em tempo real
   - Lista de usuários com indicador de câmera
   - Clique para assistir qualquer câmera

2. **Máscaras Virtuais** (Planos Pagos)
   - BASIC: Backgrounds, filtros 2D, modo anonimato
   - PREMIUM: Máscaras 3D, AR effects, face swap

3. **Marketplace de Talentos**
   - Sistema de moeda virtual (Estrelas)
   - Conversas pagas P2P
   - Avaliações e reputação
   - Categorias: conversas, música, ensino, místico, etc.

4. **Gamificação**
   - Bônus de Estrelas
   - Eventos especiais
   - Sistema de badges
   - Ranking de prestadores

## Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase
- Conta LiveKit Cloud

### Instalação

```bash
# Instalar dependências
npm install

# Copiar .env.example para .env e configurar variáveis
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
VITE_LIVEKIT_API_KEY=your_api_key
VITE_LIVEKIT_API_SECRET=your_api_secret
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Estrutura do Projeto

```
src/
├── components/       # Componentes React organizados por feature
├── hooks/           # Custom hooks
├── services/        # Integrações com APIs externas
├── store/           # Zustand stores
├── types/           # TypeScript types
├── utils/           # Funções utilitárias
├── config/          # Configurações
├── styles/          # Estilos globais
└── pages/           # Páginas da aplicação
```

## Planos de Assinatura

- **FREE**: R$ 0/mês - Acesso básico
- **BASIC**: R$ 19,90/mês - Filtros de vídeo + criar salas
- **PREMIUM**: R$ 39,90/mês - Máscaras 3D + cabines secretas + jogos

## Sistema de Estrelas (Moeda Virtual)

- 1 Estrela = R$ 0,10
- Pacotes de 50 a 1500 Estrelas
- Bônus de até 50% em pacotes maiores
- Comissão da plataforma: 20%
- Saque mínimo: 100 Estrelas (R$ 10,00)

## Licença

Todos os direitos reservados.
