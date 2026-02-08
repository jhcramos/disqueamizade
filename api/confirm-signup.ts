import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  // Auto-confirm user email via admin API
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true,
  })

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ confirmed: true })
}
