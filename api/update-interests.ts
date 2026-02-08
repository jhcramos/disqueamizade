import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  const { hobbies } = req.body
  if (!Array.isArray(hobbies)) return res.status(400).json({ error: 'hobbies must be an array' })
  if (hobbies.length > 15) return res.status(400).json({ error: 'Max 15 interests' })

  // Save to user_metadata via admin
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, hobbies }
  })

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true, hobbies })
}
