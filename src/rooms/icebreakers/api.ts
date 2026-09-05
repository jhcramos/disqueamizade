import { supabase } from '@/services/supabase/client'
import type { Input, Round } from './types'
const messages: Record<string,string> = {
 unauthorized:'Sua sessão expirou. Entre novamente.', forbidden:'Esta sala não oferece a brincadeira.',
 banned:'Sua participação está suspensa.', invalid_request:'Confira sua resposta (até 160 caracteres).',
 blocked_content:'Não são permitidos links nesta brincadeira.', cooldown:'Já há uma rodada ou uma pausa em andamento.',
 stale_round:'Essa rodada já terminou. Atualize o painel.', phase_closed:'O tempo dessa etapa terminou.',
 already_answered:'Sua resposta já foi recebida.', round_full:'Esta rodada atingiu 24 participantes. Você pode acompanhar.',
}
export async function icebreakerRequest(roomSlug:string,input:Input):Promise<Round> {
 const {data:{session}}=await supabase.auth.getSession()
 if(!session) throw new Error(messages.unauthorized)
 const {data,error}=await supabase.functions.invoke('icebreaker',{body:{roomSlug,...input},headers:{Authorization:`Bearer ${session.access_token}`}})
 if(error) {
  let code=''
  try{code=(await error.context?.json())?.error||''}catch{/* generic message */}
  throw new Error(messages[code]||'Não foi possível atualizar a brincadeira. Tente novamente.')
 }
 if(!data || !['idle','answering','guessing','revealed','finished'].includes(data.phase)) throw new Error('Resposta indisponível. Tente novamente.')
 return data as Round
}
