import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

const METERED_DOMAIN = process.env.METERED_DOMAIN || 'disqueamizade.metered.live'
const METERED_API_KEY = process.env.METERED_API_KEY || ''
const ALLOWED_ORIGINS = new Set([
  'https://disqueamizade.com.br',
  'https://www.disqueamizade.com.br',
  'https://disqueamizade.vercel.app',
])

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type')
  res.setHeader('Cache-Control', 'no-store')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res)

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!METERED_API_KEY) return res.status(503).json({ error: 'TURN credentials unavailable' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Invalid token' })

  const meteredUrl = `https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${encodeURIComponent(METERED_API_KEY)}`
  const meteredRes = await fetch(meteredUrl)

  if (!meteredRes.ok) {
    return res.status(502).json({ error: 'TURN provider failed' })
  }

  const servers = await meteredRes.json()
  return res.status(200).json(servers)
}
