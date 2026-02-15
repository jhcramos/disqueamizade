import { useState, useEffect, useRef, useCallback } from 'react'
import { useTTS } from './useTTS'

// ─── Types ───
export interface UserBio {
  displayName: string
  city?: string
  interests?: string[]
  about?: string
  mood?: string
  lookingFor?: string[]
}

export interface BotMessage {
  id: string
  content: string
  timestamp: Date
  type: 'entrance' | 'departure' | 'icebreaker' | 'introduction' | 'jukebox'
}

// ─── Helpers ───
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const room = (name: string) => name || 'a Sala'
const INTEREST_EMOJIS: Record<string, string> = {
  'Música': '🎵', 'Esportes': '⚽', 'Games': '🎮', 'Leitura': '📚',
  'Filmes/Séries': '🎬', 'Tecnologia': '💻', 'Culinária': '🍳', 'Viagens': '✈️',
  'Arte': '🎨', 'Fitness': '🏋️', 'Fotografia': '📷', 'Animais': '🐾',
  'Idiomas': '🌍', 'Teatro': '🎭', 'Automóveis': '🚗',
}

// ─── AI ANNOUNCEMENT GENERATOR (Gemini Flash Lite - free tier) ───
const GEMINI_KEY = 'AIzaSyDdz6KBLoUU2y1WwqE-JeZ5ABPft2o5hUI'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`

const AI_SYSTEM = [
  'Você é o Arauto, apresentador carismático do Disque Amizade (chat brasileiro).',
  'Crie uma apresentação CURTA (máx 200 caracteres, 2-3 linhas) EXTREMAMENTE POSITIVA e ENGRAÇADA.',
  '',
  'O TOM É: elogiar a pessoa de forma exagerada e cômica, como se fosse a pessoa mais incrível que já entrou no chat.',
  'Exemplos de estilo:',
  '- "Chegou o incrivelmente simpático NOME! A sala inteira já tá sorrindo!"',
  '- "O mais querido dos amigos acaba de entrar: NOME! 🏆"',
  '- "Ganhador do prêmio Forbes da Alegria 2026: NOME!"',
  '- "A pessoa mais interessante do Brasil acabou de entrar. Sim, é NOME."',
  '- "ALERTA DE CARISMA: NOME detectado(a). Níveis de simpatia: OVER 9000!"',
  '- "Se simpatia fosse crime, NOME pegava perpétua. Bem-vindo(a)! 😂"',
  '',
  'REGRAS:',
  '- SEMPRE elogiar, SEMPRE pra cima, SEMPRE engraçado',
  '- Inventar títulos absurdos e engraçados pra pessoa',
  '- NUNCA comece com "🎺 OUVEM-SE AS TROMBETAS"',
  '- Use 1-2 emojis no máximo',
  '- Se tiver bio/cidade, incorpore no elogio',
  '- Se NÃO tiver bio, elogie mesmo assim mas provoque pra completar perfil (termine com [📝 Completar Perfil])',
  '- Responda APENAS com o texto da apresentação, nada mais.',
].join('\n')

async function generateAIAnnouncement(
  username: string,
  bio?: UserBio,
  roomName?: string
): Promise<string | null> {
  try {
    const name = bio?.displayName || username
    let ctx = `Nome: ${name}, Sala: ${roomName || 'Geral'}`
    if (bio?.city) ctx += `, Cidade: ${bio.city}`
    if (bio?.interests?.length) ctx += `, Interesses: ${bio.interests.join(', ')}`
    if (bio?.about) ctx += `, Bio: "${bio.about}"`
    if (bio?.lookingFor?.length) ctx += `, Busca: ${bio.lookingFor.join(', ')}`

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${AI_SYSTEM}\n\nApresente: ${ctx}` }] }],
        generationConfig: { temperature: 1.3, maxOutputTokens: 100, topP: 0.95 },
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return text && text.length > 10 && text.length < 500 ? text : null
  } catch {
    return null
  }
}

// ─── CREATIVE ENTRANCE TEMPLATES (FALLBACK) ───
// 30+ varied styles - NEVER start the same way twice in a row
type EntranceFn = (name: string, rn: string, bio?: UserBio) => string

const ENTRANCE_STYLES: EntranceFn[] = [
  // Forbes da alegria
  (name, rn) => `🏆 Ganhador(a) do prêmio Forbes da Alegria 2026 acaba de entrar no ${room(rn)}: ${name}!`,
  // Mais querido
  (name, rn) => `Chegou o(a) mais querido(a) dos amigos do ${room(rn)}! ${name}, a sala já tá sorrindo! 😄`,
  // Incrivelmente simpático
  (name, rn) => `Chegou o(a) incrivelmente simpático(a) ${name}! O ${room(rn)} acaba de melhorar 200%! ✨`,
  // Pessoa mais interessante
  (name, rn) => `A pessoa mais interessante do Brasil acabou de entrar no ${room(rn)}. Sim, é ${name}. 🇧🇷`,
  // Crime de simpatia
  (name) => `Se simpatia fosse crime, ${name} pegava perpétua. Bem-vindo(a)! 😂`,
  // Over 9000
  (name, rn) => `ALERTA DE CARISMA no ${room(rn)}: ${name} detectado(a). Níveis de simpatia: OVER 9000! 🔥`,
  // Oscar
  (name, rn) => `E o Oscar de Melhor Presença no ${room(rn)} vai para... ${name}! Aplausos! 👏`,
  // Patrimônio da humanidade
  (name) => `${name} deveria ser patrimônio da humanidade. Que presença, que energia! ✨`,
  // Sorriso contagiante
  (name, rn) => `ATENÇÃO ${room(rn)}: ${name} entrou e trouxe o sorriso mais contagiante do chat! 😁`,
  // Influencer da boa vibe
  (name, rn) => `O(A) maior influencer da boa vibe chegou no ${room(rn)}: ${name}! Segue que vale a pena! 🌟`,
  // Medalha de ouro
  (name) => `🥇 Medalha de ouro em simpatia olímpica: ${name}! Ninguém compete!`,
  // Fenômeno
  (name, rn) => `Fenômeno da natureza detectado no ${room(rn)}: ${name}! Raro, precioso e incrível! 💎`,
  // QI de alegria
  (name, rn) => `${name} entrou no ${room(rn)} com QI de alegria acima de 300. Gênio da boa vibe! 🧠✨`,
  // Faustão positivo
  (name, rn) => `Ó lá! Chegou a estrela do ${room(rn)}! ${name} na área, gente! É sucesso! 🌟`,
  // Narrador de futebol
  (name, rn) => `GOOOL DE PRESENÇA! ${name} entra no ${room(rn)} e a torcida vai à loucura! ⚡`,
  // Previsão do tempo
  (name, rn) => `Previsão atualizada pro ${room(rn)}: 100% de chance de alegria. Motivo: ${name} chegou! ☀️`,
  // Herdeiro da simpatia
  (name) => `Se carisma fosse herança, ${name} nasceu milionário(a). Que pessoa incrível! 💰😂`,
  // Nota 10
  (name, rn) => `Nota 10 em tudo: simpatia, carisma e bom humor. ${name} no ${room(rn)}! ⭐`,
  // MC de festa
  (name, rn) => `Chegou quem faltava pro ${room(rn)} ficar perfeito: ${name}! DJ, solta o som! 🎶`,
  // Salvou o dia
  (name, rn) => `${name} acabou de salvar o dia do ${room(rn)}. Herói(na) sem capa! 🦸`,
  // Mais legal do mundo
  (name, rn) => `Pesquisa confirma: ${name} é oficialmente a pessoa mais legal do ${room(rn)}. Ciência! 📊`,
  // Estrela cadente
  (name, rn) => `Estrela cadente avistada no ${room(rn)}! Ah não, é ${name}. Ainda melhor! 🌠`,
  // Rei/Rainha
  (name, rn) => `Abram alas! A realeza do ${room(rn)} chegou: ${name}! Tragam o tapete vermelho! 👑`,
  // Vitamina de alegria
  (name, rn) => `${name} é tipo vitamina de alegria pro ${room(rn)}. Dose diária recomendada: infinita! 💊😄`,
  // TED Talk
  (name, rn) => `Se existisse TED Talk de simpatia, ${name} seria palestrante principal. Bem-vindo(a) ao ${room(rn)}! 🎤`,
  // WiFi de energia boa
  (name, rn) => `${name} conectou no ${room(rn)} e a energia boa tá com sinal máximo! WiFi da alegria! 📶`,
  // Melhor plot twist
  (name, rn) => `Melhor plot twist do dia: ${name} apareceu no ${room(rn)}! Tudo ficou mais legal! 📈`,
  // Embaixador da alegria
  (name, rn) => `Embaixador(a) oficial da alegria brasileira, ${name}, acaba de honrar o ${room(rn)} com sua presença! 🇧🇷`,
  // Upgrade
  (name, rn) => `O ${room(rn)} acaba de receber um UPGRADE premium: ${name} entrou! Tudo melhorou! ⬆️`,
  // Presente de aniversário
  (name, rn) => `Não é aniversário de ninguém, mas ${name} no ${room(rn)} é o melhor presente! 🎁`,
]

// City-specific additions
const CITY_FLAVORS: Record<string, string[]> = {
  'São Paulo': ['direto da terra da garoa ☔', 'representando Sampa 🏙️', 'entre um trânsito e outro 🚗'],
  'Rio de Janeiro': ['trazendo o sotaque carioca 🏖️', 'direto da Cidade Maravilhosa 🌊', 'malandro(a) raiz do Rio 😎'],
  'Belo Horizonte': ['e o pão de queijo? Trouxe? 🧀', 'mineirinho(a) de BH 🏔️', 'trem bão demais!'],
  'Porto Alegre': ['bah, tchê! 🧉', 'gaúcho(a) na área! Esfria o chimarrão ☕', 'representando o Sul 🌿'],
  'Salvador': ['axé! 🎵', 'baiano(a) com dendê na veia 🌶️', 'trazendo o tempero da Bahia'],
  'Curitiba': ['do frio de Curitiba pro calor do chat ❄️', 'curitibano(a) raiz 🌲'],
  'Recife': ['com frevo na alma 🎵', 'pernambucano(a) com orgulho 🦀'],
  'Fortaleza': ['cearense na área! O humor acaba de melhorar 😂', 'direto do sol de Fortaleza ☀️'],
  'Brasília': ['direto da capital federal 🏛️', 'brasiliense representando'],
  'Manaus': ['da selva pro chat 🌳', 'representando o Norte 🐊'],
  'Florianópolis': ['direto da Ilha da Magia 🏝️', 'floripa vibes ✌️'],
  'Goiânia': ['goiano(a) raiz 🤠', 'do cerrado pro chat 🌻'],
}

function buildCreativeEntrance(name: string, rn: string, bio?: UserBio): string {
  const baseFn = pick(ENTRANCE_STYLES)
  let text = baseFn(name, rn, bio)

  // Add city flavor if available
  if (bio?.city && CITY_FLAVORS[bio.city]) {
    text += ` — ${pick(CITY_FLAVORS[bio.city])}`
  } else if (bio?.city) {
    text += ` — direto de ${bio.city} 📍`
  }

  // Add interests if available
  if (bio?.interests && bio.interests.length > 0) {
    const ints = bio.interests.slice(0, 2).map(i => `${INTEREST_EMOJIS[i] || '✨'}${i}`).join(' e ')
    text += `\nCurte ${ints}.`
  }

  // Add looking_for flavor (public info, ok to show)
  const LOOKING_LABELS: Record<string, string> = {
    'amizade': 'fazer amizades 🤝',
    'namoro': 'encontrar o amor 💕',
    'bate-papo': 'bater um papo 💬',
    'networking': 'fazer networking 💼',
    'games': 'jogar junto 🎮',
  }
  if (bio?.lookingFor && bio.lookingFor.length > 0) {
    const goals = bio.lookingFor.slice(0, 2).map(l => LOOKING_LABELS[l] || l).join(' e ')
    text += `\nVeio pra ${goals}.`
  }

  // If no bio, add profile nudge
  if (!bio?.city && !bio?.interests?.length) {
    text += '\n[📝 Completar Perfil]'
  }

  return text
}

// ─── DEPARTURE TEMPLATES (varied) ───
const DEPARTURES: ((name: string, rn: string) => string)[] = [
  (name) => `${name} saiu. O chat perdeu brilho. Só um pouquinho. 🌙`,
  (name, rn) => `👋 ${name} deixou o ${room(rn)}. Até a próxima!`,
  (name) => `${name} desconectou. Provavelmente foi viver a vida real. Estranho, né? 🤔`,
  (name, rn) => `📴 ${name} offline. O ${room(rn)} sentirá sua falta. Talvez.`,
  (name) => `E assim, ${name} partiu. Lendas dizem que volta amanhã. 🌅`,
  (name) => `${name} saiu como entrou: com estilo. 😎👋`,
  (name, rn) => `⚡ ${name} deslogou do ${room(rn)}. O WiFi agradece.`,
  (name) => `${name} foi embora. O Arauto não tá chorando, é o vento. 🌬️`,
]

// ─── ICEBREAKERS ───
type IcebreakerFn = (roomName: string) => string

const ICEBREAKERS: IcebreakerFn[] = [
  (rn) => `O ${room(rn)} tá quieto... Conta aí: qual a coisa mais aleatória que vocês já compraram online? 🛒`,
  (rn) => `Silêncio no ${room(rn)}! DEBATE: biscoito ou bolacha? ⚔️`,
  (rn) => `Ei ${room(rn)}, qual a mentira mais absurda que alguém já acreditou de vocês? 🤥`,
  (_rn) => `🎲 Quiz: quantos estados do Brasil vocês nomeiam em 30 segundos? GO!`,
  (rn) => `O ${room(rn)} precisa de vida! Se vocês fossem uma comida, qual seriam? 🍕`,
  (rn) => `Tá quieto... Pizza com ketchup: crime ou direito humano? O ${room(rn)} decide! 🍕`,
  (rn) => `${room(rn)}, qual a música que vocês ouvem escondido e NEGAM? Confessem 🎵`,
  (rn) => `Ei ${room(rn)}! Se pudessem ter um superpoder inútil, qual seria? 🦸`,
  (rn) => `Fun fact: mel nunca estraga. Acharam mel de 3000 anos no Egito e tava bom! 🍯 O ${room(rn)} sabia?`,
  (rn) => `O ${room(rn)} tá parado! Contem a coisa mais vergonhosa da infância de vocês 😂`,
  (rn) => `Hot dog com purê: genial ou heresia? O ${room(rn)} PRECISA responder! 🌭`,
  (rn) => `📊 Enquete: banho de manhã ou à noite? Sem "depende"! O ${room(rn)} quer certezas!`,
  (rn) => `Se tivessem que comer UMA comida pro resto da vida, qual? O ${room(rn)} julga. 🍽️`,
  (rn) => `Fato: polvos têm 3 corações. Quantos corações o ${room(rn)} tem? 🐙`,
  (rn) => `A primeira webcam foi criada pra vigiar uma CAFETEIRA ☕📹 Prioridades! O ${room(rn)} concorda?`,
  (rn) => `Duas verdades e uma mentira sobre vocês. O ${room(rn)} adivinha! 🎯`,
  (rn) => `Se vocês do ${room(rn)} pudessem jantar com qualquer pessoa viva, quem seria? 🍽️`,
  (rn) => `Descrevam o que fazem da vida usando APENAS emojis. ${room(rn)}, GO! 🎮`,
  (rn) => `Qual série/filme vocês reassistiram MAIS vezes? O ${room(rn)} quer saber 🎬`,
  (rn) => `Strogonoff: frango ou carne? O ${room(rn)} vai rachar ao meio nessa! 🍗🥩`,
]

// ─── STAGE TEMPLATES ───
const STAGE_UP: ((name: string, rn: string) => string)[] = [
  (name, rn) => `🎤 ${name} sobe ao palco do ${room(rn)}! Show time!`,
  (name) => `🌟 Com vocês: ${name}! Aplausos! 👏`,
  (name, rn) => `O palco do ${room(rn)} é de ${name} agora. Holofotes! 🔦`,
  (name) => `🎙️ ${name} no mic! Respira fundo e manda ver!`,
  (name, rn) => `${name} assumiu o palco do ${room(rn)}. O show começa AGORA ⚡`,
]

const STAGE_DOWN: ((name: string, rn: string) => string)[] = [
  (name) => `👏 Aplausos para ${name}! Show de bola!`,
  (name) => `${name} desceu do palco. Nota: 10! 🌟`,
  (name) => `🎤 ${name} dropou o mic. Lendário.`,
  (name) => `Obrigado, ${name}! O palco é grato. ✨`,
]

const STAGE_QUEUE: ((name: string, rn: string) => string)[] = [
  (name) => `🎫 ${name} entrou na fila do palco!`,
  (name) => `${name} quer o mic! Na fila... 🎤`,
  (name) => `Próximo(a) candidato(a): ${name}! 🎫`,
]

const STAGE_EMPTY: ((rn: string) => string)[] = [
  (rn) => `🎤 Palco livre no ${room(rn)}! Quem se arrisca?`,
  (rn) => `O mic do ${room(rn)} tá esfriando... Alguém salva! 🎤❄️`,
  (rn) => `Palco vazio no ${room(rn)}. O próximo herói que se apresente! 🦸`,
]

const JUKEBOX_REACTIONS: ((rn: string) => string)[] = [
  (rn) => `🎵 O ${room(rn)} virou balada! Quem mandou essa?`,
  () => `Essa música... O Arauto aprova. 🎶👌`,
  (rn) => `DJ do ${room(rn)} mandou bem! Nota 10 🎵`,
  () => `Trilha sonora perfeita. Falta só a pipoca! 🍿`,
  (rn) => `O nível musical do ${room(rn)} subiu 300%! 📈🎵`,
  () => `Quem colocou essa? Preciso apertar sua mão! 🤝🎵`,
]

// ─── INTRODUCTION TEMPLATES ───
const INTRODUCTIONS: ((u1: string, u2: string, common: string, rn: string) => string)[] = [
  (u1, u2, c) => `🤝 @${u1} e @${u2}: ambos curtem ${c}! Tá aí o início de uma amizade.`,
  (u1, u2, c, rn) => `Match no ${room(rn)}! @${u1} e @${u2} curtem ${c} — conversem! ✨`,
  (u1, u2, c) => `📡 Conexão detectada: @${u1} + @${u2} = fãs de ${c}! Comecem a conversar!`,
  (u1, u2, c) => `@${u1} e @${u2}, vocês dois curtem ${c}. Coincidência? O Arauto não acredita em coincidências. 😏`,
]

// ─── TTS-FRIENDLY STRIP ───
const stripForTTS = (text: string): string =>
  text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u200D]/gu, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

// ─── Bot Bios for simulated users ───
export const BOT_BIOS: Record<string, UserBio> = {
  'gabizinha_22': { displayName: 'Gabi', city: 'Rio de Janeiro', interests: ['Música', 'Filmes/Séries', 'Viagens'], about: 'Apaixonada por MPB e cinema!', mood: '🥳' },
  'thiago.m': { displayName: 'Thiago', city: 'São Paulo', interests: ['Esportes', 'Games', 'Tecnologia'], about: 'Dev por dia, gamer por noite', mood: '😎' },
  'bruninha💜': { displayName: 'Bruna', city: 'Belo Horizonte', interests: ['Arte', 'Fotografia', 'Culinária'], about: 'Artista e cozinheira nas horas vagas', mood: '😄' },
  'duda_carioca': { displayName: 'Duda', city: 'Rio de Janeiro', interests: ['Fitness', 'Viagens', 'Música'], about: 'Sempre na praia! 🏖️', mood: '🔥' },
  'leoferreira': { displayName: 'Leo', city: 'Porto Alegre', interests: ['Esportes', 'Games', 'Automóveis'], about: 'Gremista e petrolhead', mood: '😎' },
  'juh.santos': { displayName: 'Juh', city: 'Salvador', interests: ['Música', 'Teatro', 'Culinária'], about: 'Axé no sangue!', mood: '🥳' },
  'marquinhos_zl': { displayName: 'Marquinhos', city: 'São Paulo', interests: ['Games', 'Tecnologia', 'Música'], about: 'ZL representando!', mood: '🔥' },
  'carol.vibes': { displayName: 'Carol', city: 'Curitiba', interests: ['Leitura', 'Filmes/Séries', 'Idiomas'], about: 'Bookworm bilíngue 📖', mood: '🤔' },
  'ricardooo': { displayName: 'Ricardo', city: 'Brasília', interests: ['Esportes', 'Viagens', 'Fotografia'], about: 'Fotógrafo viajante', mood: '😄' },
  'natyyy_': { displayName: 'Naty', city: 'Recife', interests: ['Música', 'Arte', 'Animais'], about: 'Mãe de 3 gatos 🐱', mood: '😍' },
  'felipão92': { displayName: 'Felipe', city: 'Fortaleza', interests: ['Esportes', 'Culinária', 'Viagens'], about: 'Cearense raiz', mood: '😄' },
  'isa.morena': { displayName: 'Isa', city: 'Manaus', interests: ['Idiomas', 'Viagens', 'Música'], about: 'Poliglota em treinamento', mood: '😎' },
  'andrelucas': { displayName: 'André', city: 'São Paulo', interests: ['Tecnologia', 'Games', 'Automóveis'], about: 'Engenheiro e nerd', mood: '🤔' },
  'amandinha.s': { displayName: 'Amanda', city: 'Florianópolis', interests: ['Fitness', 'Fotografia', 'Viagens'], about: 'Viciada em trilha!', mood: '🔥' },
  'diegomv': { displayName: 'Diego', city: 'Goiânia', interests: ['Música', 'Esportes', 'Games'], about: 'Sertanejo universitário fan', mood: '🥳' },
}

// ─── Hook ───
export function useHostBot() {
  const [botMessages, setBotMessages] = useState<BotMessage[]>([])
  const lastBotMessageTime = useRef(0)
  const { speak, stop: stopTTS, isEnabled: isTTSEnabled, setEnabled: setTTSEnabled } = useTTS()
  const lastChatActivityTime = useRef(Date.now())
  const recentIcebreakers = useRef<Set<number>>(new Set())
  const recentEntrants = useRef<{ username: string; bio?: UserBio; time: number }[]>([])

  const addBotMessage = useCallback((content: string, type: BotMessage['type']) => {
    const now = Date.now()
    if (now - lastBotMessageTime.current < 180000 && type === 'icebreaker') return null
    
    const msg: BotMessage = {
      id: `arauto-${now}-${Math.random().toString(36).slice(2, 6)}`,
      content,
      timestamp: new Date(),
      type,
    }
    lastBotMessageTime.current = now
    setBotMessages(prev => [...prev, msg])
    return msg
  }, [])

  // Generate entrance announcement (AI-first, template fallback)
  const announceEntrance = useCallback((username: string, bio?: UserBio, roomName: string = ''): BotMessage | null => {
    const displayName = bio?.displayName || username
    const rn = roomName || 'a Sala'

    // Immediately show a creative template (instant feedback)
    const fallbackText = buildCreativeEntrance(displayName, rn, bio)
    const msg = addBotMessage(fallbackText, 'entrance')
    speak(stripForTTS(fallbackText), 'entrance', true)

    // Fire-and-forget AI enhancement: replace message if AI returns fast enough
    generateAIAnnouncement(username, bio, rn).then((aiText) => {
      if (aiText && msg) {
        setBotMessages(prev =>
          prev.map(m => m.id === msg.id ? { ...m, content: aiText } : m)
        )
      }
    })

    // Track for introductions
    recentEntrants.current.push({ username, bio, time: Date.now() })
    recentEntrants.current = recentEntrants.current.filter(e => Date.now() - e.time < 60000)

    // Check for introductions
    if (recentEntrants.current.length >= 2) {
      const recent = recentEntrants.current.slice(-2)
      const shared = findCommonInterests(recent[0].bio, recent[1].bio)
      if (shared.length > 0) {
        setTimeout(() => {
          const introText = pick(INTRODUCTIONS)(recent[0].username, recent[1].username, shared[0], rn)
          addBotMessage(introText, 'introduction')
        }, 3000)
      }
    }

    return msg
  }, [addBotMessage])

  // Generate farewell
  const announceDeparture = useCallback((username: string, bio?: UserBio, roomName: string = ''): BotMessage | null => {
    const displayName = bio?.displayName || username
    const rn = roomName || 'a Sala'
    const content = pick(DEPARTURES)(displayName, rn)
    speak(stripForTTS(content), 'farewell')
    return addBotMessage(content, 'departure')
  }, [addBotMessage])

  // Find common interests
  const findCommonInterests = (bio1?: UserBio, bio2?: UserBio): string[] => {
    if (!bio1?.interests || !bio2?.interests) return []
    return bio1.interests.filter(i => bio2.interests!.includes(i))
  }

  // Get random icebreaker (avoids repeats)
  const getIcebreaker = useCallback((roomName: string = ''): string => {
    const rn = roomName || 'a Sala'
    const available = ICEBREAKERS.map((fn, i) => ({ fn, i })).filter(({ i }) => !recentIcebreakers.current.has(i))
    
    let chosen: { fn: IcebreakerFn; i: number }
    if (available.length === 0) {
      recentIcebreakers.current.clear()
      chosen = { fn: ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)], i: 0 }
    } else {
      chosen = pick(available)
    }
    
    recentIcebreakers.current.add(chosen.i)
    if (recentIcebreakers.current.size > 10) {
      const arr = Array.from(recentIcebreakers.current)
      recentIcebreakers.current = new Set(arr.slice(-10))
    }
    return chosen.fn(rn)
  }, [])

  // Stage announcements
  const announceStageUp = useCallback((username: string, roomName: string = ''): BotMessage | null => {
    const content = pick(STAGE_UP)(username, roomName || 'a Sala')
    speak(stripForTTS(content), 'entrance', true)
    return addBotMessage(content, 'entrance')
  }, [addBotMessage])

  const announceStageDown = useCallback((username: string, roomName: string = ''): BotMessage | null => {
    const content = pick(STAGE_DOWN)(username, roomName || 'a Sala')
    speak(stripForTTS(content), 'farewell')
    return addBotMessage(content, 'departure')
  }, [addBotMessage])

  const announceStageQueue = useCallback((username: string, roomName: string = ''): BotMessage | null => {
    if (Math.random() > 0.6) return null
    const content = pick(STAGE_QUEUE)(username, roomName || 'a Sala')
    return addBotMessage(content, 'entrance')
  }, [addBotMessage])

  const announceStageEmpty = useCallback((roomName: string = ''): BotMessage | null => {
    const content = pick(STAGE_EMPTY)(roomName || 'a Sala')
    return addBotMessage(content, 'icebreaker')
  }, [addBotMessage])

  // Jukebox reaction
  const reactToJukebox = useCallback((roomName: string = ''): BotMessage | null => {
    if (Math.random() > 0.35) return null
    const content = pick(JUKEBOX_REACTIONS)(roomName || 'a Sala')
    speak(stripForTTS(content), 'reaction')
    return addBotMessage(content, 'jukebox')
  }, [addBotMessage])

  // Track chat activity
  const markChatActivity = useCallback(() => {
    lastChatActivityTime.current = Date.now()
  }, [])

  // Icebreaker timer
  useEffect(() => {
    const interval = setInterval(() => {
      const silenceDuration = Date.now() - lastChatActivityTime.current
      if (silenceDuration >= 120000) {
        const icebreaker = getIcebreaker()
        const msg = addBotMessage(icebreaker, 'icebreaker')
        if (msg) {
          speak(stripForTTS(icebreaker), 'icebreaker')
        }
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [getIcebreaker, addBotMessage])

  return {
    botMessages,
    announceEntrance,
    announceDeparture,
    getIcebreaker,
    reactToJukebox,
    markChatActivity,
    findCommonInterests,
    BOT_BIOS,
    announceStageUp,
    announceStageDown,
    announceStageQueue,
    announceStageEmpty,
    isTTSEnabled,
    setTTSEnabled,
    stopTTS,
  }
}
