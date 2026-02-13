// Vercel Serverless Function — Send transactional emails via Resend
// POST /api/send-email
// Body: { type: 'welcome' | 'reset' | 'magic-link' | 'email-change', to: string, username?: string, url: string, newEmail?: string }

import type { VercelRequest, VercelResponse } from '@vercel/node'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'Disque Amizade <noreply@disqueamizade.com.br>'
const FROM_EMAIL_FALLBACK = 'Disque Amizade <onboarding@resend.dev>'

// Inline templates to avoid import issues in serverless
const BRAND_COLOR = '#7C3AED'
const BRAND_URL = 'https://disqueamizade.vercel.app'

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
<tr><td style="background:linear-gradient(135deg,${BRAND_COLOR},#a855f7);padding:32px 40px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🎭 Disque Amizade</h1>
</td></tr>
<tr><td style="padding:32px 40px;">${content}</td></tr>
<tr><td style="padding:24px 40px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
<p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.5;">Disque Amizade — Conectando pessoas de verdade 💜<br>
<a href="${BRAND_URL}" style="color:${BRAND_COLOR};text-decoration:none;">${BRAND_URL}</a></p>
</td></tr>
</table>
</td></tr></table></body></html>`
}

function btn(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
<tr><td style="background:${BRAND_COLOR};border-radius:8px;">
<a href="${url}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;">${text}</a>
</td></tr></table>`
}

function getTemplate(type: string, username: string, url: string, newEmail?: string) {
  switch (type) {
    case 'welcome':
      return {
        subject: `Bem-vindo ao Disque Amizade, ${username}! 🎉`,
        html: baseLayout('Confirme seu Email', `
          <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Oi, ${username}! 👋</h2>
          <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">Que bom ter você no <strong>Disque Amizade</strong>! Falta só um clique pra começar.</p>
          ${btn('✅ Confirmar meu Email', url)}
          <p style="margin:0;color:#71717a;font-size:13px;">Se você não criou uma conta, pode ignorar este email.</p>`),
      }
    case 'reset':
      return {
        subject: 'Redefinir sua senha — Disque Amizade 🔑',
        html: baseLayout('Redefinir Senha', `
          <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Oi, ${username}! 🔑</h2>
          <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">Recebemos um pedido para redefinir sua senha.</p>
          ${btn('🔐 Redefinir minha Senha', url)}
          <p style="margin:0 0 8px;color:#71717a;font-size:13px;">Este link expira em 1 hora.</p>
          <p style="margin:0;color:#71717a;font-size:13px;">Se você não pediu isso, pode ignorar este email.</p>`),
      }
    case 'magic-link':
      return {
        subject: 'Seu link de acesso — Disque Amizade ✨',
        html: baseLayout('Link Mágico', `
          <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Entrar sem senha ✨</h2>
          <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">Clique no botão abaixo para entrar instantaneamente:</p>
          ${btn('🚀 Entrar Agora', url)}
          <p style="margin:0;color:#71717a;font-size:13px;">Este link expira em 15 minutos.</p>`),
      }
    case 'email-change':
      return {
        subject: 'Confirme a mudança de email — Disque Amizade 📧',
        html: baseLayout('Mudança de Email', `
          <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Oi, ${username}! 📧</h2>
          <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">Você solicitou a mudança do seu email para <strong>${newEmail}</strong>.</p>
          ${btn('📧 Confirmar novo Email', url)}
          <p style="margin:0;color:#71717a;font-size:13px;">Se você não pediu esta mudança, entre em contato conosco.</p>`),
      }
    default:
      return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' })
  }

  const { type, to, username = 'amigo(a)', url, newEmail } = req.body || {}

  if (!type || !to || !url) {
    return res.status(400).json({ error: 'Missing required fields: type, to, url' })
  }

  const template = getTemplate(type, username, url, newEmail)
  if (!template) {
    return res.status(400).json({ error: `Unknown email type: ${type}` })
  }

  // Use fallback sender if domain not yet verified
  const from = FROM_EMAIL

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      // If domain not verified, retry with fallback
      if (data?.message?.includes('not verified') || data?.statusCode === 403) {
        const retryRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL_FALLBACK,
            to: [to],
            subject: template.subject,
            html: template.html,
          }),
        })
        const retryData = await retryRes.json()
        if (!retryRes.ok) {
          return res.status(retryRes.status).json({ error: retryData })
        }
        return res.status(200).json({ success: true, id: retryData.id, fallback: true })
      }
      return res.status(response.status).json({ error: data })
    }

    return res.status(200).json({ success: true, id: data.id })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
