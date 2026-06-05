import type { VercelRequest, VercelResponse } from '@vercel/node'

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

type UserBio = {
  displayName?: string
  city?: string
  interests?: string[]
  about?: string
  lookingFor?: string[]
}

function cleanString(value: unknown, maxLength = 500): string | undefined {
  if (typeof value !== 'string') return undefined
  const clean = value.trim().slice(0, maxLength)
  return clean || undefined
}

function cleanStringArray(value: unknown, maxItems = 8, maxLength = 80): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const clean = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
  return clean.length ? clean : undefined
}

function buildContext(body: Record<string, unknown>): string {
  const username = cleanString(body.username, 80) || 'Visitante'
  const roomName = cleanString(body.roomName, 80) || 'Geral'
  const rawBio = typeof body.bio === 'object' && body.bio !== null ? (body.bio as Record<string, unknown>) : {}

  const bio: UserBio = {
    displayName: cleanString(rawBio.displayName, 80),
    city: cleanString(rawBio.city, 80),
    interests: cleanStringArray(rawBio.interests),
    about: cleanString(rawBio.about, 300),
    lookingFor: cleanStringArray(rawBio.lookingFor),
  }

  const name = bio.displayName || username
  const parts = [`Nome: ${name}`, `Sala: ${roomName}`]
  if (bio.city) parts.push(`Cidade: ${bio.city}`)
  if (bio.interests?.length) parts.push(`Interesses: ${bio.interests.join(', ')}`)
  if (bio.about) parts.push(`Bio: "${bio.about}"`)
  if (bio.lookingFor?.length) parts.push(`Busca: ${bio.lookingFor.join(', ')}`)
  return parts.join(', ')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    return res.status(503).json({ error: 'AI announcement service is not configured' })
  }

  try {
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
    const ctx = buildContext(body as Record<string, unknown>)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${encodeURIComponent(geminiKey)}`

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${AI_SYSTEM}\n\nApresente: ${ctx}` }] }],
        generationConfig: { temperature: 1.3, maxOutputTokens: 100, topP: 0.95 },
      }),
    })

    if (!geminiRes.ok) {
      return res.status(502).json({ error: 'AI provider error' })
    }

    const data = await geminiRes.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!text || text.length < 10 || text.length > 500) {
      return res.status(502).json({ error: 'AI provider returned invalid text' })
    }

    return res.status(200).json({ text })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate announcement' })
  }
}
