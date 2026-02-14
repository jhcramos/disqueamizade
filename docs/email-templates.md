# Disque Amizade — Email Templates (Supabase Auth)

Apply these in Supabase Dashboard → Authentication → Email Templates
Project: uquztttljpswheiikbkw

## Sender Name
`Disque Amizade`

## 1. Reset Password

**Subject:** Redefinir sua senha — Disque Amizade

**Body:**
```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; overflow: hidden;">
  <div style="padding: 40px 30px; text-align: center;">
    <h1 style="color: white; font-size: 28px; margin: 0 0 8px 0;">💬 Disque Amizade</h1>
    <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">Conexões reais, conversas que importam</p>
  </div>
  <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px;">
    <h2 style="color: #1a1a2e; font-size: 22px; margin: 0 0 16px 0;">Redefinir sua senha</h2>
    <p style="color: #444; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Recebemos um pedido para redefinir a senha da sua conta no Disque Amizade. Clique no botão abaixo para criar uma nova senha:
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
        Redefinir Senha
      </a>
    </div>
    <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0;">
      Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá a mesma.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
      © 2026 Disque Amizade · disqueamizade.com.br
    </p>
  </div>
</div>
```

## 2. Confirm Signup

**Subject:** Confirme sua conta — Disque Amizade

**Body:**
```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; overflow: hidden;">
  <div style="padding: 40px 30px; text-align: center;">
    <h1 style="color: white; font-size: 28px; margin: 0 0 8px 0;">💬 Disque Amizade</h1>
    <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">Conexões reais, conversas que importam</p>
  </div>
  <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px;">
    <h2 style="color: #1a1a2e; font-size: 22px; margin: 0 0 16px 0;">Bem-vindo ao Disque Amizade! 🎉</h2>
    <p style="color: #444; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Falta só um passo! Confirme seu email clicando no botão abaixo para começar a conversar:
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
        Confirmar Email
      </a>
    </div>
    <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0;">
      Se você não criou uma conta no Disque Amizade, ignore este email.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
      © 2026 Disque Amizade · disqueamizade.com.br
    </p>
  </div>
</div>
```

## 3. Magic Link

**Subject:** Seu link de acesso — Disque Amizade

**Body:**
```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; overflow: hidden;">
  <div style="padding: 40px 30px; text-align: center;">
    <h1 style="color: white; font-size: 28px; margin: 0 0 8px 0;">💬 Disque Amizade</h1>
    <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">Conexões reais, conversas que importam</p>
  </div>
  <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px;">
    <h2 style="color: #1a1a2e; font-size: 22px; margin: 0 0 16px 0;">Seu link de acesso</h2>
    <p style="color: #444; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Clique no botão abaixo para entrar na sua conta do Disque Amizade:
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
        Entrar no Disque Amizade
      </a>
    </div>
    <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0;">
      Se você não solicitou este link, ignore este email.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
      © 2026 Disque Amizade · disqueamizade.com.br
    </p>
  </div>
</div>
```

## 4. Change Email

**Subject:** Confirme seu novo email — Disque Amizade

**Body:**
```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; overflow: hidden;">
  <div style="padding: 40px 30px; text-align: center;">
    <h1 style="color: white; font-size: 28px; margin: 0 0 8px 0;">💬 Disque Amizade</h1>
    <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">Conexões reais, conversas que importam</p>
  </div>
  <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px;">
    <h2 style="color: #1a1a2e; font-size: 22px; margin: 0 0 16px 0;">Confirme seu novo email</h2>
    <p style="color: #444; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Clique no botão abaixo para confirmar a alteração do seu email no Disque Amizade:
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
        Confirmar Novo Email
      </a>
    </div>
    <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0;">
      Se você não solicitou esta alteração, ignore este email.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #aaa; font-size: 12px; text-align: center; margin: 0;">
      © 2026 Disque Amizade · disqueamizade.com.br
    </p>
  </div>
</div>
```

## How to Apply

1. Go to: https://supabase.com/dashboard/project/uquztttljpswheiikbkw/auth/templates
2. For each template type, paste the Subject and Body
3. Save

## SMTP Settings (Optional - Custom sender)
To remove "Supabase Auth" as sender:
1. Go to: Project Settings → Authentication → SMTP Settings
2. Enable custom SMTP
3. Use hello@disqueamizade.com.br or noreply@disqueamizade.com.br
4. Or use a service like Resend, SendGrid, etc.
