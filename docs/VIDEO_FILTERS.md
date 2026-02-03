# Sistema de Filtros de Vídeo com MediaPipe

## 📋 Visão Geral

Sistema completo de filtros e efeitos de vídeo em tempo real usando Google MediaPipe. Principal diferencial competitivo da plataforma e driver chave de monetização.

## 🎭 Catálogo de Filtros

### PLANO FREE (R$ 0/mês)
- ❌ Sem acesso a filtros
- Apenas vídeo original

### PLANO BASIC (R$ 19,90/mês)

#### Backgrounds (4 filtros)
- **Desfocar Fundo** 🌫️ - Segmentação com MediaPipe Selfie Segmentation
- **Grid Tron** 🌐 - Background futurista com grid perspectivo animado
- **Cidade Cyberpunk** 🏙️ - Fundo de cidade neon estilo blade runner
- **Espaço Sideral** 🌌 - Background de espaço com estrelas e nebulosas

#### Máscaras 2D (2 filtros)
- **Óculos Neon** 🕶️ - Óculos futuristas com Face Mesh (468 pontos)
- **Chapéu Digital** 🎩 - Chapéu holográfico sobreposto

#### Filtros de Cor (3 filtros)
- **Preto e Branco** ⚫⚪ - Conversão monocromática clássica
- **Sépia** 🟤 - Efeito vintage envelhecido
- **Neon Boost** 💠 - Aumenta saturação de cyan e magenta

#### Anonimato (1 filtro)
- **Modo Anônimo** 🔒 - Pixelização do rosto mantendo movimentos detectados

**Total BASIC: 10 filtros**

### PLANO PREMIUM (R$ 39,90/mês)

#### Máscaras 3D (3 filtros)
- **Capacete Tron** 🎭 - Máscara 3D futurista com animação de brilho neon
- **Robot Cyborg** 🤖 - Transformação robótica completa em 3D
- **Alien** 👽 - Máscara alienígena animada com textura procedural

#### Backgrounds Animados (2 filtros)
- **Matrix Code** 🟢 - Código Matrix animado em loop
- **Cyber City Animated** 🌃 - Cidade cyberpunk com parallax e neon piscante

#### Efeitos Especiais (3 filtros)
- **Glitch Digital** ⚡ - Efeito de falha/corrupção digital randômico
- **Holograma** ✨ - Efeito de projeção holográfica com scan lines
- **Partículas Neon** 💫 - Sistema de partículas flutuantes ao redor do rosto

**Total PREMIUM: +8 filtros (18 no total)**

## 🏗️ Arquitetura Técnica

### Stack Tecnológico

**MediaPipe Models:**
- `@mediapipe/selfie_segmentation` - Segmentação pessoa/fundo
- `@mediapipe/face_mesh` - 468 pontos faciais para máscaras
- `@mediapipe/face_detection` - Detecção rápida de rosto

**Pipeline de Processamento:**
```
Camera Stream (MediaDevices)
    ↓
HTMLVideoElement (hidden)
    ↓
MediaPipe Processing (WebAssembly)
    ↓
Canvas Rendering (2D Context)
    ↓
Filter Application
    ↓
Output MediaStream (canvas.captureStream())
    ↓
LiveKit VideoTrack Replacement
```

### Hook: `useVideoFilters`

```typescript
const {
  activeFilter,      // Filtro atualmente ativo
  isProcessing,      // Se está processando frame
  mediaPipeLoaded,   // Se MediaPipe carregou
  applyFilter,       // Função para aplicar filtro
  removeFilter,      // Remove todos os filtros
  canUseFilter,      // Verifica se usuário pode usar
  getAvailableFilters, // Lista filtros disponíveis
  videoRef,          // Ref para <video>
  canvasRef,         // Ref para <canvas>
} = useVideoFilters(userTier)
```

### Componente: `VideoFilterControls`

Toolbar completa para seleção de filtros.

**Props:**
- `userTier: SubscriptionTier` - Plano do usuário
- `onFilterApplied?: (filter) => void` - Callback quando filtro aplicado

**Features:**
- ✅ Tabs por categoria (Todos, Fundo, Rosto, Cor, Efeitos, Anonimato)
- ✅ Grid de filtros com thumbnail e descrição
- ✅ Badge de plano requerido (🔒 para bloqueados, PRO para premium)
- ✅ Modal de upgrade quando tenta usar filtro bloqueado
- ✅ Indicador de processamento
- ✅ Info do plano atual
- ✅ Botão para remover filtro ativo

### Componente: `VideoFilterPreview`

Preview em tempo real do vídeo com filtro aplicado.

**Props:**
- `userTier: SubscriptionTier`

**Features:**
- ✅ Container aspect-ratio 16:9
- ✅ Mock preview (em produção, mostra vídeo real)
- ✅ Stats: Filtro ON/OFF, FPS, Qualidade

## 🔧 Implementação MediaPipe (Produção)

### Inicialização

```typescript
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation'
import { FaceMesh } from '@mediapipe/face_mesh'

// Selfie Segmentation (background blur/replacement)
const segmenter = new SelfieSegmentation({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
})
await segmenter.setOptions({
  modelSelection: 1, // 0=general (256x256), 1=landscape (256x144)
  selfieMode: true,
})
await segmenter.initialize()

// Face Mesh (facial landmarks for masks)
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
})
await faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
})
await faceMesh.initialize()
```

### Processamento de Frame

```typescript
const processFrame = async () => {
  const video = videoRef.current
  const canvas = canvasRef.current
  if (!video || !canvas) return

  const ctx = canvas.getContext('2d')!
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // Aplicar filtro baseado no tipo
  switch (activeFilter.id) {
    case 'blur-background':
      await applyBackgroundBlur(video, canvas, segmenter)
      break

    case 'bg-tron-grid':
      await applyCustomBackground(video, canvas, segmenter, tronGridImage)
      break

    case 'mask-glasses':
      await applyFaceMask(video, canvas, faceMesh, glassesImage)
      break

    case 'color-bw':
      applyColorFilter(video, canvas, 'grayscale')
      break

    case 'anonymity-pixelate':
      await applyPixelation(video, canvas, faceMesh)
      break

    // ... outros filtros
  }

  // Loop
  requestAnimationFrame(processFrame)
}

// Iniciar processamento
processFrame()
```

### Background Blur

```typescript
const applyBackgroundBlur = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  segmenter: SelfieSegmentation
) => {
  const ctx = canvas.getContext('2d')!

  // Segmentar pessoa do fundo
  await segmenter.send({ image: video })

  segmenter.onResults((results) => {
    // Draw original frame
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

    // Apply blur to background
    ctx.globalCompositeOperation = 'destination-atop'
    ctx.filter = 'blur(15px)'
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height)

    // Draw person on top (unblurred)
    ctx.globalCompositeOperation = 'destination-over'
    ctx.filter = 'none'
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

    ctx.restore()
  })
}
```

### Background Replacement

```typescript
const applyCustomBackground = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  segmenter: SelfieSegmentation,
  backgroundImage: HTMLImageElement
) => {
  const ctx = canvas.getContext('2d')!

  await segmenter.send({ image: video })

  segmenter.onResults((results) => {
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw custom background
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)

    // Composite person on top
    ctx.globalCompositeOperation = 'destination-atop'
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height)

    ctx.globalCompositeOperation = 'destination-over'
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

    ctx.restore()
  })
}
```

### Face Mask (2D)

```typescript
const applyFaceMask = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  faceMesh: FaceMesh,
  maskImage: HTMLImageElement
) => {
  const ctx = canvas.getContext('2d')!

  await faceMesh.send({ image: video })

  faceMesh.onResults((results) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0]

      // Get key points (eyes, nose, etc.)
      const leftEye = landmarks[33]  // Left eye outer corner
      const rightEye = landmarks[263] // Right eye outer corner

      // Calculate position and scale
      const eyeDistance = Math.sqrt(
        Math.pow((rightEye.x - leftEye.x) * canvas.width, 2) +
        Math.pow((rightEye.y - leftEye.y) * canvas.height, 2)
      )

      const maskWidth = eyeDistance * 2.5
      const maskHeight = maskImage.height * (maskWidth / maskImage.width)

      const centerX = (leftEye.x + rightEye.x) / 2 * canvas.width
      const centerY = (leftEye.y + rightEye.y) / 2 * canvas.height - maskHeight * 0.1

      // Draw mask
      ctx.drawImage(
        maskImage,
        centerX - maskWidth / 2,
        centerY - maskHeight / 2,
        maskWidth,
        maskHeight
      )
    }
  })
}
```

### Pixelation (Anonymity Mode)

```typescript
const applyPixelation = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  faceMesh: FaceMesh
) => {
  const ctx = canvas.getContext('2d')!

  await faceMesh.send({ image: video })

  faceMesh.onResults((results) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0]

      // Get face bounding box
      const xs = landmarks.map(l => l.x * canvas.width)
      const ys = landmarks.map(l => l.y * canvas.height)

      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)

      const faceWidth = maxX - minX
      const faceHeight = maxY - minY

      // Pixelate face region
      const pixelSize = 20
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')!

      tempCanvas.width = faceWidth / pixelSize
      tempCanvas.height = faceHeight / pixelSize

      // Downscale
      tempCtx.drawImage(
        canvas,
        minX, minY, faceWidth, faceHeight,
        0, 0, tempCanvas.width, tempCanvas.height
      )

      // Upscale (pixelated effect)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(
        tempCanvas,
        0, 0, tempCanvas.width, tempCanvas.height,
        minX, minY, faceWidth, faceHeight
      )
      ctx.imageSmoothingEnabled = true
    }
  })
}
```

### Color Filters

```typescript
const applyColorFilter = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  filterType: 'grayscale' | 'sepia' | 'neon'
) => {
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (filterType === 'grayscale') {
    ctx.filter = 'grayscale(100%)'
  } else if (filterType === 'sepia') {
    ctx.filter = 'sepia(100%)'
  } else if (filterType === 'neon') {
    ctx.filter = 'saturate(200%) contrast(120%) hue-rotate(180deg)'
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  ctx.filter = 'none'
}
```

### Integração com LiveKit

```typescript
import { useLocalParticipant } from '@livekit/components-react'

const VideoRoomWithFilters = () => {
  const { localParticipant } = useLocalParticipant()
  const { canvasRef, activeFilter } = useVideoFilters(userTier)

  useEffect(() => {
    if (!canvasRef.current) return

    // Create stream from canvas
    const stream = canvasRef.current.captureStream(30) // 30 FPS
    const videoTrack = stream.getVideoTracks()[0]

    // Replace LiveKit video track
    localParticipant.setCameraEnabled(false)
    // ... wait for camera to stop
    localParticipant.publishTrack(videoTrack)

  }, [activeFilter, canvasRef, localParticipant])

  return <div>{/* LiveKit components */}</div>
}
```

## 📊 Performance

### Métricas Target

| Métrica | Free | Basic | Premium |
|---------|------|-------|---------|
| FPS | 30 | 25-30 | 20-30 |
| CPU Usage | 5% | 10-15% | 15-20% |
| Latência | <50ms | <100ms | <150ms |
| Memory | 50MB | 100MB | 200MB |

### Otimizações

**1. Processing Rate:**
- Processar a 15 FPS (imperceptível para usuário)
- Interpolar frames entre processamentos

**2. WebAssembly:**
- MediaPipe roda em WASM (performance nativa)
- ~10x mais rápido que JS puro

**3. Web Workers:**
- Processar frames em background thread
- Não bloquear UI

**4. Canvas Offscreen:**
- `OffscreenCanvas` para rendering em worker
- Disponível em browsers modernos

**5. Asset Caching:**
- Pre-carregar imagens de máscaras e backgrounds
- Reusar objetos, evitar alocações

**6. Adaptive Quality:**
- Reduzir resolução se FPS < 20
- Desabilitar filtros complexos automaticamente

## 🧪 Testes

### Teste de Performance

```bash
# Chrome DevTools Performance profiling
1. Abrir DevTools → Performance
2. Ativar filtro Premium (máscara 3D)
3. Gravar por 30 segundos
4. Analisar:
   - CPU usage deve ser < 20%
   - FPS deve ser > 20
   - Memory não deve crescer (leak check)
```

### Teste de Compatibilidade

| Browser | Suporte | Notas |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Melhor performance |
| Firefox 88+ | ✅ Full | Boa performance |
| Safari 14+ | ⚠️ Parcial | Alguns filtros mais lentos |
| Edge 90+ | ✅ Full | Baseado em Chromium |
| Mobile Chrome | ✅ Full | Performance reduzida |
| Mobile Safari | ⚠️ Parcial | iOS 14.5+ |

### Fallback Strategy

```typescript
const canUseFilters = () => {
  // Check WebAssembly support
  if (typeof WebAssembly === 'undefined') return false

  // Check canvas support
  const canvas = document.createElement('canvas')
  if (!canvas.getContext('2d')) return false

  // Check MediaDevices API
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false

  return true
}

if (!canUseFilters()) {
  // Show message: "Seu navegador não suporta filtros de vídeo"
  // Continuar sem filtros
}
```

## 💰 Impacto na Monetização

### Conversão Esperada

**Free → Basic:**
- Principal motivador: Filtros básicos + anonimato
- Taxa de conversão esperada: 8-12%
- Payback: ~6 meses

**Basic → Premium:**
- Principal motivador: Máscaras 3D + efeitos especiais
- Taxa de conversão esperada: 15-20%
- Payback: ~3 meses

### Análise Competitiva

| Plataforma | Filtros | Preço | Diferencial |
|------------|---------|-------|-------------|
| **Disque Amizade** | 18 filtros | R$19.90-39.90 | 3D masks + anonymity |
| Zoom | 5 filtros | R$67/mês | Apenas backgrounds |
| Snapchat | ~100 filtros | Grátis | Mas não é videochat |
| Instagram | ~50 filtros | Grátis | Mas não é videochat |
| Discord | 0 filtros | - | Sem filtros nativos |

**Vantagem Competitiva:**
- ✅ Único videochat em grupo com máscaras 3D
- ✅ Modo anonimato (privacidade)
- ✅ Design Tron/Cyberpunk (único)
- ✅ Preço acessível vs corporativo (Zoom)

## 🚀 Roadmap

### Fase 1 ✅ (Implementado)
- [x] Arquitetura de filtros
- [x] Catálogo completo (18 filtros)
- [x] Hook useVideoFilters
- [x] Componente VideoFilterControls
- [x] Componente VideoFilterPreview
- [x] Página de demonstração (/filters)
- [x] Integração com sistema de permissões

### Fase 2 (Próximos Passos)
- [ ] Conectar MediaPipe (selfie segmentation + face mesh)
- [ ] Implementar backgrounds blur/replacement
- [ ] Implementar máscaras 2D
- [ ] Implementar filtros de cor
- [ ] Implementar modo anonimato (pixelação)

### Fase 3 (Avançado)
- [ ] Máscaras 3D com Three.js
- [ ] Backgrounds animados (video loops)
- [ ] Efeitos especiais (particles, glitch)
- [ ] Integração completa com LiveKit
- [ ] Performance otimizations (Web Workers + OffscreenCanvas)

### Fase 4 (Futuro)
- [ ] Custom filters (usuários criam próprios filtros)
- [ ] Filter marketplace (comprar/vender filtros)
- [ ] AR effects avançados (hand tracking, full body)
- [ ] Face swap com IA generativa
- [ ] Green screen virtual

## 📞 Troubleshooting

**Problema:** FPS baixo (<15)
- Reduzir resolução de processamento
- Desabilitar filtros complexos
- Usar modelo lightweight do MediaPipe

**Problema:** High CPU usage (>30%)
- Processar a 10 FPS em vez de 15
- Usar Web Worker para offload
- Simplificar filtros (remover animações)

**Problema:** Máscaras descalibradas
- Aumentar `minDetectionConfidence` para 0.7
- Usar `refineLandmarks: true`
- Smooth landmarks com média móvel

**Problema:** Safari não funciona
- Verificar suporte a OffscreenCanvas
- Fallback para canvas normal
- Testar iOS 14.5+

## 📚 Recursos

- [MediaPipe Docs](https://google.github.io/mediapipe/)
- [Selfie Segmentation Guide](https://google.github.io/mediapipe/solutions/selfie_segmentation.html)
- [Face Mesh Guide](https://google.github.io/mediapipe/solutions/face_mesh.html)
- [LiveKit Video Processing](https://docs.livekit.io/)
- [Canvas API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

**Status de Implementação**: ✅ UI completa | ✅ Arquitetura | ⏳ MediaPipe integration pendente

**Última atualização**: 2026-01-30
