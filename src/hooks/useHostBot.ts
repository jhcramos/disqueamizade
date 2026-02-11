import { useState, useEffect, useRef, useCallback } from 'react'
import { useTTS } from './useTTS'

// ─── Types ───
export interface UserBio {
  displayName: string
  city?: string
  interests?: string[]
  about?: string
  mood?: string
}

export interface BotMessage {
  id: string
  content: string
  timestamp: Date
  type: 'entrance' | 'departure' | 'icebreaker' | 'introduction' | 'jukebox'
}

// ─── Icebreakers (30+ total) ───
const ICEBREAKERS = {
  questions: [
    '🎺 O Arauto pergunta: Se vocês pudessem jantar com qualquer pessoa da história, quem seria? 🤔',
    '🎺 O Arauto quer saber: Qual o melhor filme que vocês já viram na vida? 🎬',
    '🎺 Vocês preferem... viver sem música ou sem internet? Respondam! 🎵💻',
    '🎺 O Arauto pergunta: Se pudessem ter qualquer superpoder, qual seria? 🦸',
    '🎺 O Arauto está curioso: Qual o lugar mais incrível que vocês já visitaram? ✈️',
    '🎺 O Arauto indaga: Qual foi o melhor show que vocês já foram? 🎤',
    '🎺 Pergunta real: Qual a comida que vocês não vivem sem? 🍔',
  ],
  quizzes: [
    '🎺 Quiz relâmpago! Em que ano o Brasil ganhou a primeira Copa do Mundo? ⚽ (Resposta em 30s...)',
    '🎺 Quiz relâmpago! Qual é a capital da Austrália? 🦘 (Não é Sydney!)',
    '🎺 Quiz relâmpago! Quantos estados tem o Brasil? 🇧🇷',
    '🎺 Quiz relâmpago! Quem pintou a Mona Lisa? 🎨',
    '🎺 Quiz relâmpago! Em que ano caiu o Muro de Berlim? 🧱',
    '🎺 Quiz relâmpago! Qual o maior planeta do sistema solar? 🪐',
  ],
  debates: [
    '🎺 Hora do debate! Pizza: borda recheada ou tradicional? 🍕',
    '🎺 Hora do debate! Praia ou montanha? ⛰️🏖️',
    '🎺 O eterno debate! Pizza doce é crime ou arte? 🍕🍫',
    '🎺 Hora do debate! Café com ou sem açúcar? ☕',
    '🎺 Hora do debate! Cachorro ou gato? 🐕🐈',
    '🎺 Polêmica! Coxinha ou esfiha? Escolham seu lado! 🥟',
    '🎺 Hora do debate! Star Wars ou Star Trek? 🚀',
  ],
  games: [
    '🎺 Complete a frase: Se eu ganhasse na loteria, a primeira coisa que eu faria seria... 💰',
    '🎺 Jogo! Duas verdades e uma mentira — cada um conta 3 coisas sobre si! 🤥',
    '🎺 Complete a frase: O melhor conselho que já recebi foi... 💡',
    '🎺 Jogo! Descrevam-se em apenas 3 emojis! 😎🎵🍕',
    '🎺 Complete a frase: Se eu fosse presidente por um dia, eu... 🏛️',
    '🎺 Jogo! Contem algo que ninguém aqui sabe sobre vocês! 🤫',
  ],
  curiosidades: [
    '🎺 Verdade ou mito? A Grande Muralha da China é visível do espaço 🧐',
    '🎺 Sabiam que o Brasil tem mais de 300 espécies de palmeiras? 🌴 País tropical de verdade!',
    '🎺 Curiosidade: O primeiro videogame da história foi criado em 1958! 🎮 Mais velho que muito avô por aí!',
    '🎺 Sabiam que o recorde de maior tempo sem dormir é de 11 dias? 😴 Não tentem isso em casa!',
    '🎺 Curiosidade: O nome "Brasil" vem do pau-brasil, a árvore! 🌳',
    '🎺 Sabiam que uma pessoa ri em média 13 vezes por dia? Vamos aumentar essa média! 😂',
    '🎺 Curiosidade anos 80: O primeiro celular pesava quase 1kg! 📱 Hoje a gente reclama de 200g kkkk',
  ],
}

const ALL_ICEBREAKERS = [
  ...ICEBREAKERS.questions,
  ...ICEBREAKERS.quizzes,
  ...ICEBREAKERS.debates,
  ...ICEBREAKERS.games,
  ...ICEBREAKERS.curiosidades,
]

const JUKEBOX_REACTIONS = [
  '🎺 O Arauto aprova esta escolha musical! 👏',
  '🎺 Que som! O Arauto está balançando a capa real! 💃',
  '🎺 Excelente gosto musical, nobre DJ! 🎶',
  '🎺 O Arauto dança! Essa música é digna da corte! 🕺✨',
  '🎺 Puts, essa bateu no coração do Arauto! ❤️🎵',
]

const INTEREST_EMOJIS: Record<string, string> = {
  'Música': '🎵',
  'Esportes': '⚽',
  'Games': '🎮',
  'Leitura': '📚',
  'Filmes/Séries': '🎬',
  'Tecnologia': '💻',
  'Culinária': '🍳',
  'Viagens': '✈️',
  'Arte': '🎨',
  'Fitness': '🏋️',
  'Fotografia': '📷',
  'Animais': '🐾',
  'Idiomas': '🌍',
  'Teatro': '🎭',
  'Automóveis': '🚗',
}

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
  const recentIcebreakers = useRef<Set<string>>(new Set())
  const recentEntrants = useRef<{ username: string; bio?: UserBio; time: number }[]>([])

  const addBotMessage = useCallback((content: string, type: BotMessage['type']) => {
    const now = Date.now()
    // Rate limit: max 1 bot message per 3 minutes (180000ms)
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

  // Generate entrance announcement
  const announceEntrance = useCallback((username: string, bio?: UserBio): BotMessage | null => {
    const displayName = bio?.displayName || username
    let content: string

    if (bio && bio.interests && bio.interests.length > 0 && bio.city) {
      const interestLines = bio.interests.map(i => `${INTEREST_EMOJIS[i] || '✨'} ${i}`).join('\n')
      content = `🎺 OUVEM-SE AS TROMBETAS! 👑\n\nAdentra a sala o ilustríssimo ${displayName.toUpperCase()}!\n\n${interestLines}\n🏙️ Direto de ${bio.city}${bio.about ? `\n💬 "${bio.about}"` : ''}${bio.mood ? ` ${bio.mood}` : ''}\n\nSejam todos gentis com nosso nobre convidado! 🎉`
    } else {
      content = `🎺 OUVEM-SE AS TROMBETAS! 👑\n\nUm misterioso viajante adentra a sala... 🕵️\n\nSeu nome? ${displayName.toUpperCase()}. Mas isso é tudo que sabemos!\n\n${displayName}, complete seu perfil para que possamos anunciá-lo(a) com a honra que merece!\n[📝 Completar Perfil]`
    }

    // Track for introductions
    recentEntrants.current.push({ username, bio, time: Date.now() })
    // Clean old entrants (>60s)
    recentEntrants.current = recentEntrants.current.filter(e => Date.now() - e.time < 60000)

    const msg = addBotMessage(content, 'entrance')

    // TTS: Speak the entrance announcement with fanfare
    if (bio && bio.interests && bio.interests.length > 0 && bio.city) {
      const interests = bio.interests.slice(0, 2).join(' e ')
      speak(
        `Ouvem-se as trombetas! Adentra a sala o ilustríssimo ${displayName}! Amante de ${interests}, direto de ${bio.city}!`,
        'entrance',
        true // with fanfare
      )
    } else {
      speak(
        'Um misterioso viajante adentra a sala! Quem será? Complete seu perfil!',
        'entrance',
        true
      )
    }

    // Check for introductions (2+ new people within 1 min)
    if (recentEntrants.current.length >= 2) {
      const recent = recentEntrants.current.slice(-2)
      const shared = findCommonInterests(recent[0].bio, recent[1].bio)
      if (shared.length > 0) {
        setTimeout(() => {
          addBotMessage(
            `🎺 Atenção! Temos novos nobres na corte! @${recent[0].username} e @${recent[1].username}, vocês dois curtem ${shared[0]}! Conversem! 🤝`,
            'introduction'
          )
        }, 3000)
      }
    }

    return msg
  }, [addBotMessage])

  // Generate farewell
  const announceDeparture = useCallback((username: string, bio?: UserBio): BotMessage | null => {
    const displayName = bio?.displayName || username
    speak(`O nobre ${displayName} parte para outras aventuras. Até breve!`, 'farewell')
    return addBotMessage(
      `🎺 O nobre ${displayName.toUpperCase()} parte para outras aventuras. Até breve! 👋✨`,
      'departure'
    )
  }, [addBotMessage])

  // Get random icebreaker (avoids repeats)
  const getIcebreaker = useCallback((): string => {
    const available = ALL_ICEBREAKERS.filter(i => !recentIcebreakers.current.has(i))
    if (available.length === 0) {
      recentIcebreakers.current.clear()
      return ALL_ICEBREAKERS[Math.floor(Math.random() * ALL_ICEBREAKERS.length)]
    }
    const pick = available[Math.floor(Math.random() * available.length)]
    recentIcebreakers.current.add(pick)
    // Keep only last 10
    if (recentIcebreakers.current.size > 10) {
      const arr = Array.from(recentIcebreakers.current)
      recentIcebreakers.current = new Set(arr.slice(-10))
    }
    return pick
  }, [])

  // Find common interests between two users
  const findCommonInterests = (bio1?: UserBio, bio2?: UserBio): string[] => {
    if (!bio1?.interests || !bio2?.interests) return []
    return bio1.interests.filter(i => bio2.interests!.includes(i))
  }

  // Jukebox reaction (random, not every song)
  const reactToJukebox = useCallback((): BotMessage | null => {
    if (Math.random() > 0.35) return null // ~35% chance
    const reaction = JUKEBOX_REACTIONS[Math.floor(Math.random() * JUKEBOX_REACTIONS.length)]
    const shortExclamations = ['Que música!', 'O Arauto aprova!', 'Excelente gosto musical!', 'Essa é digna da corte!']
    speak(shortExclamations[Math.floor(Math.random() * shortExclamations.length)], 'reaction')
    return addBotMessage(reaction, 'jukebox')
  }, [addBotMessage])

  // Track chat activity
  const markChatActivity = useCallback(() => {
    lastChatActivityTime.current = Date.now()
  }, [])

  // Icebreaker timer: check every 30s, post if quiet for 2+ min
  useEffect(() => {
    const interval = setInterval(() => {
      const silenceDuration = Date.now() - lastChatActivityTime.current
      if (silenceDuration >= 120000) { // 2 minutes of silence
        const icebreaker = getIcebreaker()
        addBotMessage(icebreaker, 'icebreaker')
        // TTS: speak just the question part
        const questionMatch = icebreaker.match(/O Arauto (?:pergunta|quer saber|indaga|está curioso):?\s*(.+?)(?:\s*[🤔🎬💻🦸✈️🎤🍔]|$)/)
        if (questionMatch) {
          speak(`O Arauto pergunta: ${questionMatch[1]}`, 'icebreaker')
        } else {
          // Extract first sentence for other types
          const clean = icebreaker.replace(/🎺\s*/, '').split(/[!?]/)[0]
          if (clean) speak(clean, 'icebreaker')
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
    // TTS controls
    isTTSEnabled,
    setTTSEnabled,
    stopTTS,
  }
}
