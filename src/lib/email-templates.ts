// Email templates for Disque Amizade transactional emails
// Uses Resend API directly from Vercel API routes

const BRAND = {
  name: 'Disque Amizade',
  logo: 'https://disqueamizade.vercel.app/logo.png',
  color: '#7C3AED', // purple-600
  colorLight: '#EDE9FE', // purple-50
  url: 'https://disqueamizade.vercel.app',
  support: 'contato@disqueamizade.com.br',
}

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.color},#a855f7);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🎭 ${BRAND.name}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.5;">
                ${BRAND.name} — Conectando pessoas de verdade 💜<br>
                <a href="${BRAND.url}" style="color:${BRAND.color};text-decoration:none;">${BRAND.url}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function button(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr>
      <td style="background:${BRAND.color};border-radius:8px;">
        <a href="${url}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`
}

export function welcomeEmail(username: string, confirmUrl: string): { subject: string; html: string } {
  return {
    subject: `Bem-vindo ao Disque Amizade, ${username}! 🎉`,
    html: baseLayout('Confirme seu Email', `
      <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Oi, ${username}! 👋</h2>
      <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
        Que bom ter você no <strong>Disque Amizade</strong>! Falta só um clique pra você começar a conhecer pessoas incríveis.
      </p>
      <p style="margin:0 0 8px;color:#3f3f46;font-size:15px;line-height:1.6;">
        Confirme seu email clicando no botão abaixo:
      </p>
      ${button('✅ Confirmar meu Email', confirmUrl)}
      <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5;">
        Se você não criou uma conta no Disque Amizade, pode ignorar este email.
      </p>
    `),
  }
}

export function resetPasswordEmail(username: string, resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Redefinir sua senha — Disque Amizade 🔑',
    html: baseLayout('Redefinir Senha', `
      <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Oi, ${username}! 🔑</h2>
      <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
        Recebemos um pedido para redefinir a senha da sua conta no <strong>Disque Amizade</strong>.
      </p>
      <p style="margin:0 0 8px;color:#3f3f46;font-size:15px;line-height:1.6;">
        Clique no botão abaixo para criar uma nova senha:
      </p>
      ${button('🔐 Redefinir minha Senha', resetUrl)}
      <p style="margin:0 0 8px;color:#71717a;font-size:13px;line-height:1.5;">
        Este link expira em 1 hora.
      </p>
      <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5;">
        Se você não pediu isso, pode ignorar este email. Sua senha não será alterada.
      </p>
    `),
  }
}

export function magicLinkEmail(_email: string, magicUrl: string): { subject: string; html: string } {
  return {
    subject: 'Seu link de acesso — Disque Amizade ✨',
    html: baseLayout('Link Mágico', `
      <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Entrar sem senha ✨</h2>
      <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
        Clique no botão abaixo para entrar no <strong>Disque Amizade</strong> instantaneamente:
      </p>
      ${button('🚀 Entrar Agora', magicUrl)}
      <p style="margin:0 0 8px;color:#71717a;font-size:13px;line-height:1.5;">
        Este link expira em 15 minutos e só pode ser usado uma vez.
      </p>
      <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5;">
        Se você não pediu este link, pode ignorar este email.
      </p>
    `),
  }
}

export function emailChangeEmail(username: string, confirmUrl: string, newEmail: string): { subject: string; html: string } {
  return {
    subject: 'Confirme a mudança de email — Disque Amizade 📧',
    html: baseLayout('Mudança de Email', `
      <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">Oi, ${username}! 📧</h2>
      <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
        Você solicitou a mudança do seu email para <strong>${newEmail}</strong>.
      </p>
      <p style="margin:0 0 8px;color:#3f3f46;font-size:15px;line-height:1.6;">
        Confirme clicando no botão abaixo:
      </p>
      ${button('📧 Confirmar novo Email', confirmUrl)}
      <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5;">
        Se você não pediu esta mudança, entre em contato conosco imediatamente.
      </p>
    `),
  }
}
