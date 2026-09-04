// ═══════════════════════════════════════════════════════════════════════════
// Edge Function: report-user (Plano V4, Fase 3, item 3.2)
//
// Grava uma denúncia usando a service role, para que denúncias de CONVIDADOS
// (que não são usuários autenticados) também contem. Guarda o contexto
// (sala + últimas mensagens) na descrição. Um trigger no banco conta denúncias
// recentes e pode ocultar automaticamente a câmera do denunciado.
//
// Deploy: supabase functions deploy report-user
// Env (secrets): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { reportedIdentity, reporterIdentity, reason, roomSlug, context } = await req.json()
    if (!reportedIdentity || !reason) {
      return new Response(JSON.stringify({ error: 'reportedIdentity e reason são obrigatórios' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    // Só grava reporter/reported reais (UUID); convidados entram como null + descrição.
    const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
    const description = [
      roomSlug ? `sala: ${roomSlug}` : null,
      `denunciado: ${reportedIdentity}`,
      reporterIdentity ? `denunciante: ${reporterIdentity}` : null,
      context ? `contexto: ${String(context).slice(0, 500)}` : null,
    ].filter(Boolean).join(' | ')

    const { error } = await supabase.from('reports').insert({
      reporter_id: reporterIdentity && isUuid(reporterIdentity) ? reporterIdentity : null,
      reported_user_id: isUuid(reportedIdentity) ? reportedIdentity : null,
      reason: String(reason).slice(0, 50),
      description,
      status: 'pending',
    })
    if (error) throw error
    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('report-user error', e)
    return new Response(JSON.stringify({ error: 'internal' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
