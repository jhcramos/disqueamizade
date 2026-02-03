# Disque Amizade - Documentação do Projeto

## 📁 Estrutura de Documentação

Este diretório contém a documentação e evolução do planejamento do projeto.

### Arquivos

- **plano-v1-inicial.md** - Plano inicial com Agora.io, design retro clássico, broadcast apenas para pagos
- **[Link para plano atual]** - Plano v2 com LiveKit, design Tron futurista, broadcast para todos

## 🔄 Evolução do Projeto

### Versão 1 (Inicial)
- **Vídeo:** Agora.io ($450+/mês após free tier)
- **Broadcast:** Apenas planos Basic/Premium
- **Design:** Retro anos 90 nostálgico (rosa, amarelo, pixelado)
- **Custo inicial:** ~$500-700/mês

### Versão 2 (Atual)
- **Vídeo:** LiveKit ($0-50/mês inicialmente)
- **Broadcast:** Todos os usuários (incluindo FREE)
- **Design:** Tron/anos 80 futurista (neon, cyber, moderno)
- **Custo inicial:** ~$0-5/mês
- **Nova feature:** Lista interativa de usuários com câmeras
- **Nova feature:** Máscaras virtuais (MediaPipe) em planos pagos

## 🎯 Principais Mudanças na V2

### 1. Lista de Usuários com Câmeras (Feature Principal)
```
Interface mostra TODOS os usuários da sala:
├─ 📹 João (câmera ligada) ← clicável
├─ ⚫ Maria (câmera desligada)
├─ 📹 🎭 Pedro (câmera + filtro) ← clicável
└─ 📹 Ana (câmera ligada) ← clicável

Ao clicar:
→ Modal abre com vídeo da pessoa
→ Contador de viewers atualiza em tempo real
→ Múltiplas pessoas podem assistir a mesma câmera
```

### 2. Economia Massiva de Custos

| Item | V1 (Agora.io) | V2 (LiveKit) | Economia |
|------|---------------|--------------|----------|
| **Free tier** | 10k min/mês | 10k min/mês | Igual |
| **Custo após free tier** | $0.99/1000 min | $0.006/min | 40% menor |
| **30k minutos/mês** | $450-600 | $120-180 | 66% menor |
| **Auto-hospedagem** | Não disponível | $5-50/mês VPS | 90% menor |

### 3. Design: De Retro para Futurista

**Antes (V1):**
- Cores: Rosa (#FF6B9D), Amarelo (#F8B500), Marrom
- Fontes: Press Start 2P (pixel), VT323
- Elementos: Bordas tracejadas, box-shadow 3D, padrões listrados
- Referência: Anos 90 nostálgico, ICQ, MSN Messenger

**Depois (V2):**
- Cores: Cyan neon (#00F0FF), Magenta (#FF00FF), Dark (#0A0E27)
- Fontes: Orbitron, Rajdhani, Inter
- Elementos: Neon glow, glassmorphism, perspective grid
- Referência: Tron, Blade Runner, Cyberpunk 2077

### 4. Máscaras Virtuais (Anonimato)

**Tecnologia:** Google MediaPipe (100% grátis, open source)

**Plano FREE:**
- Vídeo normal
- Blur de fundo básico

**Plano BASIC (R$ 19,90):**
- Máscaras 2D (óculos, chapéus)
- **Modo Anonimato** (pixelização do rosto)
- Backgrounds virtuais estáticos
- Filtros de cor

**Plano PREMIUM (R$ 39,90):**
- Máscaras 3D animadas (capacete Tron, robot, alien)
- AR effects (orelhas de gato, chifres)
- Face swap (avatar 3D)
- Backgrounds em vídeo
- Efeitos especiais (partículas, glitch)

## 💰 Análise Financeira Comparativa

### Break-even V1 vs V2

**V1:**
- Custos: $700/mês
- Necessário: 100 assinantes
- Receita necessária: R$ 2.590/mês

**V2:**
- Custos: $45/mês
- Necessário: 50 assinantes
- Receita necessária: R$ 1.295/mês

**Vantagem V2:** Break-even 50% mais rápido!

## 🛠️ Stack Tecnológico

### Frontend
- React 19 + TypeScript
- Vite (build)
- TailwindCSS (styling)
- Zustand (state management)
- React Query (data fetching)

### Backend
- Supabase (database, auth, realtime, storage)
- LiveKit (vídeo WebRTC)
- Google MediaPipe (filtros de vídeo)

### Pagamentos
- Stripe

### Deploy
- Vercel (frontend)
- Supabase Cloud (backend)
- LiveKit Cloud (vídeo)

## 📦 Dependências Principais

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "livekit-client": "^2.0.0",
    "@livekit/components-react": "^2.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "@mediapipe/face_detection": "^0.4.0",
    "@mediapipe/selfie_segmentation": "^0.1.0",
    "@stripe/stripe-js": "^2.4.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

## 📊 Roadmap Resumido

### Fase 1: MVP (Semanas 1-6)
- [ ] Setup projeto + Supabase + LiveKit
- [ ] Design system Tron (neon, glassmorphism)
- [ ] Sistema de salas + chat texto
- [ ] **Lista de usuários com indicador de câmera**
- [ ] **Clique para assistir vídeos**
- [ ] Vídeo grid responsivo (30 participantes)

### Fase 2: Monetização (Semanas 7-10)
- [ ] Integração Stripe
- [ ] Sistema de planos (Free, Basic, Premium)
- [ ] **Filtros MediaPipe (máscaras virtuais)**
- [ ] Modo anonimato (planos pagos)
- [ ] Perfil em destaque no header

### Fase 3: Gamificação (Semanas 11-14)
- [ ] Casamento atrás da porta
- [ ] Cabines secretas (Premium)
- [ ] Sistema de moedas virtuais
- [ ] Strip poker (18+, consultar advogado)

### Fase 4: Polimento (Semanas 15-17)
- [ ] Otimizações de performance
- [ ] Analytics e métricas
- [ ] Testes de carga
- [ ] Launch prep

## ⚠️ Considerações Importantes

### Legal
- **Strip Poker:** Consultar advogado ANTES de implementar
- **LGPD/GDPR:** Política de privacidade, consentimento, exportação de dados
- **Age verification:** Sistema robusto para conteúdo 18+

### Performance
- LiveKit suporta 30 participantes facilmente
- MediaPipe usa ~10-15% CPU adicional
- Virtual scrolling para salas grandes (react-window)

### Segurança
- RLS habilitado em TODAS as tabelas Supabase
- Rate limiting (Upstash Redis)
- Moderação de conteúdo (OpenAI Moderation API)
- Webhook signature verification (Stripe)

## 🚀 Como Começar

1. **Ler plano-v1-inicial.md** (contexto histórico)
2. **Ler plano atual v2** (implementação)
3. **Setup ambiente:**
   ```bash
   # Criar conta Supabase
   # Criar conta LiveKit Cloud
   # Criar conta Stripe

   # Clone repo (quando criar)
   npm install
   npm run dev
   ```

4. **Protótipo inicial** (2-3 dias):
   - Testar LiveKit SDK
   - Testar MediaPipe filters
   - Validar design Tron

## 📝 Logs de Decisões

### 2026-01-29
- **Decisão:** Trocar Agora.io por LiveKit
  - **Motivo:** Economia de 66-90% nos custos de vídeo
  - **Trade-off:** SDK menos maduro, mas documentação excelente

- **Decisão:** Broadcast para todos (incluindo FREE)
  - **Motivo:** Democratizar plataforma, aumentar engajamento
  - **Monetização:** Filtros/máscaras virtuais em planos pagos

- **Decisão:** Design Tron futurista vs retro anos 90
  - **Motivo:** Usuário quer "moderno renovado, não antigo"
  - **Referência:** Tron, anos 80 mas futurista

- **Decisão:** Máscaras virtuais com MediaPipe
  - **Motivo:** Open source, grátis, funciona no browser
  - **Alternativa considerada:** Banuba SDK (pago, melhor qualidade)

## 📚 Recursos Úteis

### LiveKit
- Docs: https://docs.livekit.io/
- React SDK: https://docs.livekit.io/guides/room/react/
- Pricing: https://livekit.io/pricing

### MediaPipe
- Docs: https://google.github.io/mediapipe/
- Face Detection: https://google.github.io/mediapipe/solutions/face_detection
- Selfie Segmentation: https://google.github.io/mediapipe/solutions/selfie_segmentation

### Supabase
- Docs: https://supabase.com/docs
- Realtime: https://supabase.com/docs/guides/realtime
- RLS: https://supabase.com/docs/guides/auth/row-level-security

### Design Tron
- Cores: https://coolors.co/00f0ff-ff00ff-ffc300-0a0e27
- Glassmorphism: https://ui.glass/generator/
- Neon effects: https://www.cssportal.com/css-text-shadow-generator/

---

**Última atualização:** 2026-01-29
**Versão do plano:** v2
**Status:** Planejamento concluído, aguardando aprovação
