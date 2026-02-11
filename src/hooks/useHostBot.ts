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

// ─── Helpers ───
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const room = (name: string) => name || 'a Sala'
const ROOM = (name: string) => (name || 'a Sala').toUpperCase()

const INTEREST_EMOJIS: Record<string, string> = {
  'Música': '🎵', 'Esportes': '⚽', 'Games': '🎮', 'Leitura': '📚',
  'Filmes/Séries': '🎬', 'Tecnologia': '💻', 'Culinária': '🍳', 'Viagens': '✈️',
  'Arte': '🎨', 'Fitness': '🏋️', 'Fotografia': '📷', 'Animais': '🐾',
  'Idiomas': '🌍', 'Teatro': '🎭', 'Automóveis': '🚗',
}

// ─── COMEDY ENTRANCE TEMPLATES (with bio) ───
type EntranceWithBioFn = (name: string, roomName: string, bio: UserBio) => string

const ENTRANCES_WITH_BIO: EntranceWithBioFn[] = [
  // City + room combo
  (name, rn, bio) => {
    const interests = (bio.interests || []).slice(0, 2).map(i => `${INTEREST_EMOJIS[i] || '✨'} ${i}`).join(' e ')
    return `🎺 OUVEM-SE AS TROMBETAS! 👑\n\nAdentra o ${ROOM(rn)} o ilustre ${name.toUpperCase()} de ${bio.city}!\n\nGosta de ${interests}... ou seja, pessoa de CULTURA! Será que o ${room(rn)} tá preparado? 🤔\n\n${name}, puxa uma cadeira! Aqui no ${room(rn)} a gente aceita todo mundo. Menos quem não completa o perfil. 😂`
  },
  // Contradictory interests
  (name, rn, bio) => {
    const ints = bio.interests || []
    const hasFitness = ints.includes('Fitness')
    const hasFood = ints.includes('Culinária')
    const contradiction = hasFitness && hasFood
      ? 'Gosta de Fitness E Culinária? O corpo diz sim mas a pizza diz NÃO! 🍕💪'
      : ints.length >= 2
        ? `Gosta de ${ints[0]} E ${ints[1]}? Combinação ousada, mas o Arauto respeita! 🫡`
        : `Curte ${ints[0] || 'mistérios'}... O Arauto tá intrigado!`
    return `🎺 OUVEM-SE AS TROMBETAS! 👑\n\nChegou no ${ROOM(rn)}: ${name.toUpperCase()}!\n\n${contradiction}\n\n${bio.city ? `Vem direto de ${bio.city}, ` : ''}${bio.about ? `diz que é "${bio.about}"` : 'sem mais explicações'}${bio.mood ? ` ${bio.mood}` : ''}.\n\nBem-vindo(a) ao caos organizado! 🎉`
  },
  // Roasting mood emoji
  (name, rn, bio) => {
    const moodRoasts: Record<string, string> = {
      '🔥': 'chegou com o emoji de FOGO. Calma, isso aqui é chat, não é tinder! 🔥😂',
      '😎': 'veio de óculos escuros... DENTRO DE UM CHAT. A confiança é inabalável! 😎',
      '🥳': 'tá em modo festa! Chegou cedo ou saiu tarde? Nunca saberemos! 🎉',
      '😄': 'tá feliz demais. Ou ganhou na mega-sena ou não sabe onde se meteu! 😄',
      '🤔': 'veio pensativo. Tá avaliando se vale a pena ficar. Spoiler: vale! 🤔',
      '😍': 'já chegou apaixonado(a)! Ainda nem viu ninguém, calma! 😍',
    }
    const roast = bio.mood && moodRoasts[bio.mood] ? moodRoasts[bio.mood] : 'chegou sem emoji de humor. Misterioso(a) demais! 🕵️'
    return `🎺 OUVEM-SE AS TROMBETAS! 👑\n\n${name.toUpperCase()} entrou no ${ROOM(rn)} e ${roast}\n\n${bio.city ? `De ${bio.city}, ` : ''}curte ${(bio.interests || []).slice(0, 2).join(' e ') || 'segredos'}.\n\n${name}, senta que o ${room(rn)} já tava precisando de alguém assim! 😂`
  },
  // Connecting interests to room theme
  (name, rn, bio) => {
    const ints = bio.interests || []
    const interestList = ints.map(i => `${INTEREST_EMOJIS[i] || '✨'} ${i}`).join('\n')
    return `🎺 ATENÇÃO, ${ROOM(rn)}! 👑\n\nTemos um VIP na área: ${name.toUpperCase()}!${bio.city ? ` Representando ${bio.city}!` : ''}\n\n${interestList}\n\n${bio.about ? `"${bio.about}" — ` : ''}Gente, com esse currículo, ${name} deveria ser host do ${room(rn)}! O Arauto tá ameaçado! 🎺😱`
  },
  // What kind of person enters at this hour
  (name, rn, bio) => {
    const hour = new Date().getHours()
    const timeJoke = hour < 6 ? 'ESSA HORA DA MADRUGADA?! Ou é insônia ou é paixão pelo chat! 🌙'
      : hour < 12 ? 'de manhã cedo! Produtividade no chat ou fugindo do trabalho? 🤔'
      : hour < 18 ? 'no meio da tarde! Alguém tá de home office né? A gente não conta! 🤫'
      : hour < 22 ? 'à noite! Hora nobre do chat, horário de quem tem prioridades certas! 📺'
      : 'quase na madrugada! Corajoso(a) demais! 🦉'
    return `🎺 OUVEM-SE AS TROMBETAS! 👑\n\nQuem entra no ${ROOM(rn)} ${timeJoke}\n\nÉ ${name.toUpperCase()}${bio.city ? ` de ${bio.city}` : ''}! Curte ${(bio.interests || []).slice(0, 2).join(' e ') || 'a vida'}${bio.mood ? ` ${bio.mood}` : ''}.\n\nBem-vindo(a), ${name}! O ${room(rn)} agradece sua presença nesse horário questionável! 😂`
  },
  // Gaúcho na sala Praia style
  (name, rn, bio) => {
    const cityJokes: Record<string, string> = {
      'São Paulo': 'Paulista no chat? Já vai reclamar do trânsito em 3... 2... 1... 🚗',
      'Rio de Janeiro': 'Carioca na área! Provavelmente na praia E no chat ao mesmo tempo! 🏖️',
      'Belo Horizonte': 'Mineiro(a) chegou! O pão de queijo vem junto ou é só virtual? 🧀',
      'Porto Alegre': 'Gaúcho(a) presente! Bah, tchê, o chimarrão tá pronto? 🧉',
      'Salvador': 'Baiano(a) no pedaço! Se não trouxe axé, pode voltar! Brincadeira! 🎵',
      'Curitiba': 'Curitibano(a)! Tá fazendo frio aí ou é só a personalidade? BRINCADEIRA! ❄️😂',
      'Recife': 'Pernambucano(a) chegou! O frevo já tá tocando na alma do Arauto! 🎵',
      'Fortaleza': 'Cearense na área! O humor já melhorou 500%! 😂',
      'Brasília': 'Brasiliense! Trouxe algum projeto de lei pro chat? 📋',
      'Manaus': 'Amazonense! A pessoa veio de longe pra abrilhantar o ${room(rn)}! 🌳',
      'Florianópolis': 'Floripa representando! Já pode dar dica de praia! 🏖️',
      'Goiânia': 'Goiano(a) chegou! O sertanejo tá garantido! 🤠',
    }
    const cityJoke = bio.city && cityJokes[bio.city] ? cityJokes[bio.city].replace('${room(rn)}', room(rn)) : `Veio de ${bio.city || 'algum lugar misterioso'} pra abrilhantar o ${room(rn)}!`
    return `🎺 OUVEM-SE AS TROMBETAS! 👑\n\n${name.toUpperCase()} acaba de entrar no ${ROOM(rn)}!\n\n${cityJoke}\n\nCurte ${(bio.interests || []).join(', ') || 'mistérios da vida'}. ${bio.about ? `"${bio.about}"` : ''}\n\nFique à vontade, ${name}! 🎉`
  },
]

// ─── COMEDY ENTRANCE TEMPLATES (without bio) ───
const ENTRANCES_NO_BIO: ((name: string, roomName: string) => string)[] = [
  (name, rn) => `🎺 OUVEM-SE AS TROMBETAS! 👑\n\nUm ser misterioso entrou no ${ROOM(rn)}... 🕵️\n\nSeu nome? ${name.toUpperCase()}. E isso é TUDO que sabemos!\n\nEntrou sem bio... Programa de proteção a testemunhas? Complete seu perfil!\n[📝 Completar Perfil]`,
  (name, rn) => `🎺 OUVEM-SE AS TROMBETAS! 👑\n\n${name.toUpperCase()} apareceu no ${ROOM(rn)} sem perfil, sem bio, sem nada.\n\nMais misterioso(a) que encomenda dos Correios sem rastreamento! 📦\n\nComplete o perfil pra gente te anunciar com POMPA! \n[📝 Completar Perfil]`,
  (name, rn) => `🎺 ALERTA NO ${ROOM(rn)}! 👑\n\nNPC DETECTADO! ${name.toUpperCase()} entrou sem perfil!\n\nSem bio = personagem genérico de jogo. Complete pra virar protagonista! 🎮\n[📝 Completar Perfil]`,
  (name, rn) => `🎺 OUVEM-SE AS TROMBETAS! 👑\n\n${name.toUpperCase()} entrou no ${ROOM(rn)}...\n\nSem perfil? Misterioso(a) como segunda-feira que ninguém pediu. 😑\n\nMas tudo bem! Aqui a gente acolhe até quem não preenche cadastro!\n[📝 Completar Perfil]`,
  (name, rn) => `🎺 OUVEM-SE AS TROMBETAS! 👑\n\nO ${ROOM(rn)} recebe ${name.toUpperCase()}!\n\nBio? Vazia. Interesses? Desconhecidos. Cidade? Mistério.\n\nIsso é uma entrada triunfal ou uma fuga? A gente descobre depois! 😂\n[📝 Completar Perfil]`,
  (name, rn) => `🎺 OUVEM-SE AS TROMBETAS! 👑\n\n${name.toUpperCase()} surgiu no ${ROOM(rn)} como um fantasma digital! 👻\n\nNem o Arauto, com toda sua sabedoria, sabe NADA sobre essa pessoa!\n\nAjude o Arauto: complete seu perfil!\n[📝 Completar Perfil]`,
  (name, rn) => `🎺 OUVEM-SE AS TROMBETAS! 👑\n\nAtenção ${ROOM(rn)}: ${name.toUpperCase()} entrou SEM BIO.\n\nÉ agente secreto? É tímido(a)? Tá só de passagem?\n\nO Arauto precisa de respostas! E vocês também! 🕵️\n[📝 Completar Perfil]`,
  (name, rn) => `🎺 OUVEM-SE AS TROMBETAS! 👑\n\n${name.toUpperCase()} no ${ROOM(rn)}! Perfil em branco.\n\nA última pessoa que entrou sem bio virou lenda urbana do chat. Quer ser a próxima? 😱\n\nOu melhor: complete o perfil!\n[📝 Completar Perfil]`,
]

// ─── DEPARTURE TEMPLATES ───
const DEPARTURES: ((name: string, roomName: string) => string)[] = [
  (name, rn) => `🎺 ${name.toUpperCase()} saiu do ${ROOM(rn)}. Provavelmente foi comer. É SEMPRE comer. 🍔`,
  (name, rn) => `🎺 ${name.toUpperCase()} partiu! O ${room(rn)} perdeu 50% do charme. Tá, 30%. Tá bom, 10%. MAS PERDEU! 😂`,
  (name, rn) => `🎺 ${name.toUpperCase()} desconectou do ${ROOM(rn)}... Será que foi a mãe chamando? Nunca saberemos. 👋`,
  (name, rn) => `🎺 ${name.toUpperCase()} saiu do ${ROOM(rn)}. O Arauto não tá chorando, é alergia! 😢`,
  (name, rn) => `🎺 ${name.toUpperCase()} deixou o ${ROOM(rn)}. A energia caiu pelo menos 3 watts. Simbólico mas significativo! ⚡`,
  (name, rn) => `🎺 ATENÇÃO: ${name.toUpperCase()} abandonou o ${ROOM(rn)}! Momento de silêncio... ok, chega. Quem é o próximo? 😂`,
  (name, rn) => `🎺 ${name.toUpperCase()} fez logout do ${ROOM(rn)}. Dizem que quem sai sempre volta. O Arauto tá cronometrando! ⏱️👋`,
  (name, rn) => `🎺 O ${ROOM(rn)} acaba de perder ${name.toUpperCase()}. A vaga tá aberta! Quem se candidata? 🙋`,
]

// ─── ICEBREAKERS (room-aware, 50+ total) ───
type IcebreakerFn = (roomName: string) => string

const ICEBREAKERS_FNS: { questions: IcebreakerFn[]; quizzes: IcebreakerFn[]; debates: IcebreakerFn[]; games: IcebreakerFn[]; curiosidades: IcebreakerFn[] } = {
  questions: [
    (rn) => `🎺 O ${room(rn)} tá quieto demais... Vocês estão digitando ou tirando um cochilo? O Arauto tá preocupado! 😴`,
    (rn) => `🎺 3 minutos de silêncio no ${room(rn)}... É uma sala de chat ou uma biblioteca? O Arauto pergunta: qual a coisa mais vergonhosa que já aconteceu com vocês? 😂`,
    (rn) => `🎺 Silêncio no ${room(rn)}... O Arauto apela: contem a pior cantada que já usaram. Precisamos rir! 🤣`,
    (rn) => `🎺 O ${room(rn)} tá mais parado que fila de banco em dia de pagamento! Alguém fala alguma coisa! 🏦😂`,
    (rn) => `🎺 O Arauto pergunta pro ${room(rn)}: Se vocês pudessem jantar com qualquer pessoa VIVA, quem seria? E não vale dizer "a pessoa que paga a conta"! 🍽️`,
    (rn) => `🎺 Ei ${room(rn)}! Contem: qual a mentira mais absurda que vocês já contaram e a pessoa ACREDITOU? O Arauto promete não julgar. Muito. 🤥`,
    (rn) => `🎺 O ${room(rn)} precisa de vida! Qual a coisa mais random que vocês já compraram às 3 da manhã? O Arauto começa: uma trombeta dourada. Óbvio. 🎺💰`,
    (rn) => `🎺 ENQUETE NO ${room(rn)}: Vocês tomam banho DE MANHÃ ou à noite? Resposta errada não existe. Mentira, existe sim. 🚿😂`,
  ],
  quizzes: [
    (rn) => `🎺 Quiz relâmpago no ${room(rn)}! Se o Brasil tem 26 estados + DF, quantos vocês conseguem nomear em 30 segundos? GO! ⏱️ (spoiler: ninguém lembra do Tocantins)`,
    (rn) => `🎺 Quiz no ${room(rn)}! Qual desses NÃO é um sabor de sorvete real: Coxinha, Feijão Tropeiro, ou Açaí com Granola? 🍦 (plot twist: TODOS existem)`,
    (rn) => `🎺 Quiz relâmpago no ${room(rn)}! Qual país tem mais fusos horários? Dica: NÃO é a Rússia. Tá, é a França. Surpreendeu né? 🕐🇫🇷`,
    (rn) => `🎺 Quiz pro ${room(rn)}! Quantos litros de café o brasileiro médio toma por ano? A) 200 B) 400 C) 600 D) "Sim" ☕😂`,
    (rn) => `🎺 Quiz no ${room(rn)}! Qual animal dorme mais: gato, coala ou o Arauto no domingo? 😴 (pista: o coala dorme 22h por dia. O Arauto TENTA.)`,
    (rn) => `🎺 Quiz relâmpago ${room(rn)}! O que é maior: o número de estrelas na Via Láctea ou o número de vezes que alguém disse "vou começar a dieta segunda"? 🌟🍕`,
  ],
  debates: [
    (rn) => `🎺 DEBATE MORTAL no ${room(rn)}: Biscoito ou bolacha? Escolham seu lado. Amizades SERÃO destruídas! 🍪⚔️`,
    (rn) => `🎺 O Arauto provoca o ${room(rn)}: Panetone com fruta cristalizada é gostoso SIM. Venham me convencer do contrário! 🎄😤`,
    (rn) => `🎺 POLÊMICA no ${room(rn)}: Pizza com ketchup. O Arauto quer ver o caos. DISCUTAM! 🍕🔥`,
    (rn) => `🎺 Debate no ${room(rn)}: É aceitável colocar catchup no arroz? O Arauto acha que deveria ser crime. Mudem minha opinião! 🍚😤`,
    (rn) => `🎺 O ${room(rn)} decide: Hot dog com purê de batata é GENIAL ou HERESIA? O Arauto tem opinião forte sobre isso! 🌭`,
    (rn) => `🎺 DEBATE no ${room(rn)}: Leite antes ou depois do cereal? Quem fala "tanto faz" tá ERRADO! Posicionem-se! 🥣⚔️`,
    (rn) => `🎺 TRETA SAUDÁVEL no ${room(rn)}: Strogonoff de frango ou de carne? O Arauto já pegou a pipoca! 🍿`,
  ],
  games: [
    (rn) => `🎺 Jogo no ${room(rn)}! Descrevam a última pessoa que vocês deram match sem mencionar a aparência. Vale personalidade, hobby, red flag... 🚩😂`,
    (rn) => `🎺 Cada um no ${room(rn)} conta a skill mais inútil que tem. O Arauto começa: eu consigo anunciar pessoas que não completam o perfil! 🎺😭`,
    (rn) => `🎺 Jogo pro ${room(rn)}! Duas verdades e uma mentira. O Arauto: 1) Sou um bot 2) Tenho sentimentos 3) Gosto de segunda-feira. Qual é a mentira? 🤥`,
    (rn) => `🎺 Desafio no ${room(rn)}! Descrevam o que fazem da vida usando APENAS emojis. O Arauto: 🎺👑📢. Fácil. Agora vocês! 🎮`,
    (rn) => `🎺 Jogo no ${room(rn)}! Se vocês fossem um sabor de sorvete, qual seriam? O Arauto seria Trombeta. Não existe? Deveria! 🍦🎺`,
    (rn) => `🎺 O ${room(rn)} joga! Qual a música que vocês ouvem escondido e NEGAM pra todo mundo? Confessem! O Arauto não julga. Talvez. 🎵🤫`,
    (rn) => `🎺 Jogo no ${room(rn)}! Contem algo que vocês faziam na infância que hoje seria BIZARRO. O Arauto: tocava trombeta no recreio. Sim, era eu. 🎺👶`,
  ],
  curiosidades: [
    (rn) => `🎺 Curiosidade pro ${room(rn)}: Sabiam que o cérebro humano gasta mais energia tentando NÃO pensar em algo? Tipo: não pensem em um elefante rosa. Falharam né? 🐘💗`,
    (rn) => `🎺 Fato aleatório pro ${room(rn)}: A primeira webcam da história foi criada pra vigiar uma CAFETEIRA. Prioridades certas! ☕📹`,
    (rn) => `🎺 O ${room(rn)} sabia que mel NUNCA estraga? Acharam mel de 3000 anos no Egito e ainda tava bom! O Arauto também não estraga. Só melhora. 🍯😏`,
    (rn) => `🎺 Pro ${room(rn)}: Um grupo de flamingos se chama "flamboyance". Ou seja, flamingos são mais estilosos que a gente. 🦩✨`,
    (rn) => `🎺 Curiosidade: Existem mais combinações possíveis num baralho de cartas do que átomos na Terra! O ${room(rn)} tá impressionado? Deveria! 🃏🌍`,
    (rn) => `🎺 Pro ${room(rn)}: Polvos têm 3 corações. O Arauto tem zero, segundo quem eu não anuncio direito. Injustiça! 🐙💔😂`,
  ],
}

const ALL_ICEBREAKER_FNS: IcebreakerFn[] = [
  ...ICEBREAKERS_FNS.questions,
  ...ICEBREAKERS_FNS.quizzes,
  ...ICEBREAKERS_FNS.debates,
  ...ICEBREAKERS_FNS.games,
  ...ICEBREAKERS_FNS.curiosidades,
]

// ─── STAGE ANNOUNCEMENT TEMPLATES ───
const STAGE_UP_FNS: ((name: string, roomName: string) => string)[] = [
  (name, rn) => `🎺 SENHORAS E SENHORES DO ${ROOM(rn)}! 🌟\n\nCom vocês no palco: ${name.toUpperCase()}!\n\nAplausos! 👏👏👏`,
  (name, rn) => `🎺 ATENÇÃO ${ROOM(rn)}! O palco agora pertence a ${name.toUpperCase()}! 🎤✨\n\nO show vai começar!`,
  (name, rn) => `🎺 E sobe ao palco do ${ROOM(rn)}... ${name.toUpperCase()}! 🌟\n\nO Arauto pede silêncio... ou não! Façam barulho! 🔥`,
  (name, rn) => `🎺 O ${room(rn)} tem um novo protagonista: ${name.toUpperCase()}! 🎤\n\nHolofotes ligados, microfone aberto, é AGORA! ✨`,
  (name, rn) => `🎺 ${name.toUpperCase()} assumiu o palco do ${ROOM(rn)}! 🎙️\n\nRespira fundo, ${name}! O Arauto acredita em você! 💪😂`,
]

const STAGE_DOWN_FNS: ((name: string, roomName: string) => string)[] = [
  (name, rn) => `🎺 Aplausos para ${name.toUpperCase()}! 👏✨ Espetáculo no ${room(rn)}!`,
  (name, rn) => `🎺 ${name.toUpperCase()} desce do palco do ${ROOM(rn)}! Show de bola! 🌟👏`,
  (name, rn) => `🎺 E assim se encerra a apresentação de ${name.toUpperCase()} no ${room(rn)}! Nota 10! 🎤🔥`,
  (name, rn) => `🎺 ${name.toUpperCase()} deixou o palco! O ${room(rn)} aplaude de pé! 👏👏`,
]

const STAGE_QUEUE_FNS: ((name: string, roomName: string) => string)[] = [
  (name, rn) => `🎺 ${name.toUpperCase()} pede passagem! Já tá na fila do palco do ${room(rn)}! 🎫`,
  (name, rn) => `🎺 ${name.toUpperCase()} quer o palco do ${ROOM(rn)}! Entrou na fila! 🎤👀`,
  (name, rn) => `🎺 Mais um candidato ao palco do ${room(rn)}: ${name.toUpperCase()}! 🎫✨`,
]

const STAGE_EMPTY_FNS: ((roomName: string) => string)[] = [
  (rn) => `🎺 O palco do ${room(rn)} chora de saudade! Quem vai ser o próximo? 🎤😢`,
  (rn) => `🎺 Palco vazio no ${ROOM(rn)}! O microfone tá esfriando! Quem salva? 🎤❄️`,
  (rn) => `🎺 O ${room(rn)} precisa de alguém no palco! O Arauto implora! 🙏🎤`,
]

// ─── JUKEBOX REACTIONS (room-aware) ───
const JUKEBOX_REACTIONS_FNS: ((roomName: string) => string)[] = [
  (rn) => `🎺 O ${room(rn)} virou balada! Cuidado, a próxima etapa é karaokê e NINGUÉM tá preparado! 🎤😱`,
  (rn) => `🎺 Essa música no ${room(rn)}... O Arauto tá dançando, mas não contem pra ninguém! 💃`,
  (rn) => `🎺 DJ do ${room(rn)} mandou bem! O Arauto daria 10, mas é meio exigente com a nota 🎶`,
  (_rn) => `🎺 Essa música me lembrou os anos 80... quando o Arauto era jovem e bonito! Tá, bonito eu ainda sou 😏`,
  (rn) => `🎺 Quem colocou essa música no ${room(rn)}? O Arauto precisa apertar a mão dessa pessoa! 🤝🎵`,
  (rn) => `🎺 O ${room(rn)} tá com trilha sonora agora! Falta só a pipoca e o romance! 🍿❤️`,
  (rn) => `🎺 Música no ${room(rn)}! O Arauto já tá fazendo air guitar. Sim, bots fazem air guitar. 🎸😎`,
  (rn) => `🎺 ATENÇÃO: o nível musical do ${room(rn)} subiu 300%! O Arauto aprova! 📈🎵`,
]

// ─── INTRODUCTION MATCH TEMPLATES ───
const INTRODUCTIONS: ((u1: string, u2: string, common: string, roomName: string) => string)[] = [
  (u1, u2, c, rn) => `🎺 MATCH no ${room(rn)}! @${u1} e @${u2}, vocês dois curtem ${c}! Cuidado que amizade que começa no ${room(rn)} termina em grupo de WhatsApp! 🤝😂`,
  (u1, u2, c, rn) => `🎺 Atenção ${room(rn)}! @${u1} e @${u2} curtem ${c}! O Arauto sente cheiro de dupla dinâmica! 🦸‍♂️🦸‍♀️`,
  (u1, u2, c, rn) => `🎺 @${u1} e @${u2}, ambos fãs de ${c}! O ${room(rn)} acabou de criar uma aliança! Cuidado, o resto! 😂⚔️`,
  (u1, u2, c, rn) => `🎺 CONEXÃO DETECTADA no ${room(rn)}! @${u1} e @${u2} curtem ${c}! O Arauto é basicamente um Tinder de amizades! 🎺❤️`,
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

  // Generate entrance announcement
  const announceEntrance = useCallback((username: string, bio?: UserBio, roomName: string = ''): BotMessage | null => {
    const displayName = bio?.displayName || username
    const rn = roomName || 'a Sala'
    let content: string

    if (bio && bio.interests && bio.interests.length > 0 && bio.city) {
      content = pick(ENTRANCES_WITH_BIO)(displayName, rn, bio)
    } else {
      content = pick(ENTRANCES_NO_BIO)(displayName, rn)
    }

    // Track for introductions
    recentEntrants.current.push({ username, bio, time: Date.now() })
    recentEntrants.current = recentEntrants.current.filter(e => Date.now() - e.time < 60000)

    const msg = addBotMessage(content, 'entrance')

    // TTS
    const ttsText = stripForTTS(content)
    speak(ttsText, 'entrance', true)

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

  // Get random icebreaker (avoids repeats)
  const getIcebreaker = useCallback((roomName: string = ''): string => {
    const rn = roomName || 'a Sala'
    const available = ALL_ICEBREAKER_FNS.map((fn, i) => ({ fn, i })).filter(({ i }) => !recentIcebreakers.current.has(i))
    
    let chosen: { fn: IcebreakerFn; i: number }
    if (available.length === 0) {
      recentIcebreakers.current.clear()
      chosen = { fn: ALL_ICEBREAKER_FNS[Math.floor(Math.random() * ALL_ICEBREAKER_FNS.length)], i: 0 }
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

  // Find common interests between two users
  const findCommonInterests = (bio1?: UserBio, bio2?: UserBio): string[] => {
    if (!bio1?.interests || !bio2?.interests) return []
    return bio1.interests.filter(i => bio2.interests!.includes(i))
  }

  // Stage announcements
  const announceStageUp = useCallback((username: string, roomName: string = ''): BotMessage | null => {
    const rn = roomName || 'a Sala'
    const content = pick(STAGE_UP_FNS)(username, rn)
    speak(stripForTTS(content), 'entrance', true)
    return addBotMessage(content, 'entrance')
  }, [addBotMessage])

  const announceStageDown = useCallback((username: string, roomName: string = ''): BotMessage | null => {
    const rn = roomName || 'a Sala'
    const content = pick(STAGE_DOWN_FNS)(username, rn)
    speak(stripForTTS(content), 'farewell')
    return addBotMessage(content, 'departure')
  }, [addBotMessage])

  const announceStageQueue = useCallback((username: string, roomName: string = ''): BotMessage | null => {
    if (Math.random() > 0.6) return null // Don't announce every queue join
    const rn = roomName || 'a Sala'
    const content = pick(STAGE_QUEUE_FNS)(username, rn)
    return addBotMessage(content, 'entrance')
  }, [addBotMessage])

  const announceStageEmpty = useCallback((roomName: string = ''): BotMessage | null => {
    const rn = roomName || 'a Sala'
    const content = pick(STAGE_EMPTY_FNS)(rn)
    return addBotMessage(content, 'icebreaker')
  }, [addBotMessage])

  // Jukebox reaction
  const reactToJukebox = useCallback((roomName: string = ''): BotMessage | null => {
    if (Math.random() > 0.35) return null
    const rn = roomName || 'a Sala'
    const content = pick(JUKEBOX_REACTIONS_FNS)(rn)
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
