import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { ChatError, configuredWords, moderateText, readChatBody, safeUsername } from '../_shared/chat.ts'
import { parseIcebreakerInput, QUESTIONS } from '../_shared/icebreaker.ts'
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}})
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors})
 if(req.method!=='POST') return json({error:'invalid_request'},405)
 try {
  const jwt=req.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1]
  if(!jwt) throw new ChatError('unauthorized',401)
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:auth,error}=await admin.auth.getUser(jwt)
  if(error||!auth.user) throw new ChatError('unauthorized',401)
  const input=parseIcebreakerInput(await readChatBody(req))
  let text:string|null=null,name:string|null=null
  if(input.action==='answer') {
   const [profile,settings]=await Promise.all([admin.from('profiles').select('username,display_name').eq('id',auth.user.id).maybeSingle(),admin.from('admin_settings').select('value').eq('key','moderation').maybeSingle()])
   if(profile.error||settings.error) throw new ChatError('unavailable',503)
   const words=configuredWords(settings.data?.value?.banned_words)
   text=moderateText(input.text!,words)
   name=safeUsername(profile.data?.username||profile.data?.display_name||auth.user.user_metadata?.username,words)
  }
  const {data,error:dbError}=await admin.rpc('icebreaker_action',{p_user:auth.user.id,p_room:input.roomSlug,p_action:input.action,p_round:input.roundId||null,p_text:text,p_name:name,p_answer:input.answerId||null,p_question:input.action==='start'?QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)]:null})
  if(dbError) {
   const codes:Record<string,number>={unauthorized:401,forbidden:403,banned:403,invalid_request:400,cooldown:409,stale_round:409,phase_closed:409,already_answered:409,round_full:409}
   throw new ChatError(Object.hasOwn(codes,dbError.message)?dbError.message:'unavailable',codes[dbError.message]||503)
  }
  return json(data)
 }catch(e){return e instanceof ChatError?json({error:e.code},e.status):json({error:'unavailable'},503)}
})
