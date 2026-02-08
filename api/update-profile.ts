import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify the user's JWT
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const body = req.body
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid body' })
  }

  const mode = body._mode || 'update' // 'update' or 'upsert'
  const updates = { ...body }
  delete updates._mode

  // Only allow safe fields
  const allowedFields = [
    'bio', 'cidade', 'estado', 'avatar_url', 'username', 'display_name',
    'is_creator', 'is_vip', 'is_elite', 'saldo_fichas', 'total_earned', 'hobbies'
  ]
  const safeUpdates: Record<string, any> = {}
  for (const key of allowedFields) {
    if (key in updates) safeUpdates[key] = updates[key]
  }

  if (mode === 'upsert') {
    // Create or update profile
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        { id: user.id, ...safeUpdates, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json(data)
  }

  // Default: update existing
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data)
}
