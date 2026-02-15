import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: any, res: any) {
  // Verify the user is admin via their JWT
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Check is_admin
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return res.status(403).json({ error: 'Not admin' })
  }

  if (req.method === 'GET') {
    // Fetch ALL rooms (bypasses RLS)
    const { data: rooms, error } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(rooms)
  }

  if (req.method === 'PATCH') {
    // Toggle room active status
    const { roomId, is_active } = req.body
    if (!roomId) return res.status(400).json({ error: 'roomId required' })

    const { error } = await supabaseAdmin
      .from('rooms')
      .update({ is_active })
      .eq('id', roomId)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
