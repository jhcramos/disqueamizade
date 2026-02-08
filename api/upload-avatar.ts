import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export const config = { api: { bodyParser: { sizeLimit: '2.5mb' } } }

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  const { image, contentType } = req.body
  if (!image || !contentType) return res.status(400).json({ error: 'Missing image or contentType' })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(contentType)) return res.status(400).json({ error: 'Invalid image type' })

  // Decode base64
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  // 2MB limit
  if (buffer.length > 2 * 1024 * 1024) return res.status(400).json({ error: 'Imagem muito grande. Máximo 2MB.' })

  const ext = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1]
  const filePath = `${user.id}/avatar.${ext}`

  // Upload (upsert)
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, { contentType, upsert: true })

  if (uploadError) return res.status(500).json({ error: uploadError.message })

  // Get public URL
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
  const avatarUrl = urlData.publicUrl + '?t=' + Date.now() // cache bust

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    // Fallback: update user_metadata
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, avatar_url: avatarUrl }
    })
  }

  return res.status(200).json({ avatar_url: avatarUrl })
}
