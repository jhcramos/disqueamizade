import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token', detail: 'No Authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      return res.status(401).json({ error: 'Auth failed', detail: authError.message })
    }
    if (!user) {
      return res.status(401).json({ error: 'No user found' })
    }

    const { hobbies } = req.body || {}
    if (!Array.isArray(hobbies)) {
      return res.status(400).json({ error: 'hobbies must be an array', got: typeof hobbies })
    }
    if (hobbies.length > 15) {
      return res.status(400).json({ error: 'Max 15 interests' })
    }

    // Save to user_metadata via admin
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, hobbies }
    })

    if (error) {
      return res.status(500).json({ error: error.message, detail: 'admin.updateUserById failed' })
    }

    return res.status(200).json({ ok: true, hobbies: data?.user?.user_metadata?.hobbies || hobbies })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Unknown server error', stack: e.stack?.slice(0, 200) })
  }
}
