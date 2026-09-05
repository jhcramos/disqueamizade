import { useEffect, useRef, useState } from 'react'
import { icebreakerRequest } from './api'
import type { Input, Round } from './types'

const button='rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed'
export function IcebreakerPanel({roomId,identity,connected,blocked,request:api=icebreakerRequest}:{roomId:string;identity:string;connected:boolean;blocked:Set<string>;request?:typeof icebreakerRequest}) {
 const [open,setOpen]=useState(false)
 const openRef=useRef(open);openRef.current=open
 const [round,setRound]=useState<Round|null>(null)
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const mutationPending=useRef(false)
 const [text,setText]=useState('')
 const [guesses,setGuesses]=useState<Record<string,string>>({})
 const [now,setNow]=useState(Date.now())
 const clock=useRef({server:Date.now(),local:performance.now()})
 const requestRef=useRef<((input:Input)=>Promise<void>)|null>(null)
 useEffect(()=>{
  setRound(null);setText('');setGuesses({});setError('');setBusy(false)
  if(!connected)return
  let cancelled=false,timer:ReturnType<typeof setTimeout>,pending:Promise<void>|null=null
  let currentId:string|undefined
  const request=async(input:Input)=>{
   if(input.action==='state'&&pending)return
   if(pending)await pending
   if(cancelled)return
   const operation=(async()=>{
    try {
     const data=await api(roomId,input)
     if(cancelled)return
     if(currentId!==data.id){currentId=data.id;setText('');setGuesses({})}
     clock.current={server:Date.parse(data.serverNow),local:performance.now()}
     setNow(clock.current.server);setRound(data);setError('')
    }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'Não foi possível atualizar.')}
   })()
   pending=operation
   await operation
   if(pending===operation)pending=null
  }
  requestRef.current=request
  const poll=async()=>{
   if(!document.hidden)await request({action:'state'})
   if(!cancelled)timer=setTimeout(poll,openRef.current?5000:15000)
  }
  const visible=()=>{if(!document.hidden)void request({action:'state'})}
  document.addEventListener('visibilitychange',visible)
  void poll()
  return()=>{cancelled=true;clearTimeout(timer);requestRef.current=null;document.removeEventListener('visibilitychange',visible)}
 },[roomId,identity,connected,api])
 useEffect(()=>{const timer=setInterval(()=>setNow(clock.current.server+performance.now()-clock.current.local),1000);return()=>clearInterval(timer)},[])
 const run=async(input:Input)=>{
  if(mutationPending.current||!requestRef.current)return
  mutationPending.current=true;setBusy(true)
  try{await requestRef.current(input)}finally{mutationPending.current=false;setBusy(false)}
 }
 const phase=round?.phase
 const deadline=phase==='answering'?round?.answerUntil:phase==='guessing'?round?.guessUntil:phase==='revealed'?round?.endAt:round?.nextAt
 const seconds=deadline?Math.max(0,Math.ceil((Date.parse(deadline)-now)/1000)):0
 const active=phase==='answering'||phase==='guessing'||phase==='revealed'
 const disabled=busy||!connected||!!error
 return <section className="flex-shrink-0 border-t border-white/10 bg-dark-950/95 text-white" aria-label="Quebrar o gelo">
  <button onClick={()=>{setOpen(v=>!v);if(!open)void requestRef.current?.({action:'state'})}} aria-expanded={open} aria-controls="icebreaker-content" className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-white/5">
   <span className="font-semibold">🧊 Quebrar o gelo <span className="text-dark-300 font-normal">· Quem aqui?</span></span>
   <span className="text-xs text-primary-300">{active?'Rodada em andamento':open?'Fechar':'Abrir'} {open?'⌄':'⌃'}</span>
  </button>
  {open&&<div id="icebreaker-content" className="px-4 pb-4 max-h-[48vh] overflow-y-auto">
   <p className="text-xs text-dark-300 mb-3">Uma brincadeira opcional para se conhecer. Pode participar por texto, sem câmera, ou só acompanhar.</p>
   {!connected&&<p role="status">Aguardando conexão com a sala…</p>}
   {error&&<p role="alert" className="text-sm text-amber-200 mb-3">{error} <button className="underline" disabled={busy} onClick={()=>void run({action:'state'})}>Tentar novamente</button></p>}
   {!round&&connected&&!error&&<p role="status" className="text-sm">Carregando…</p>}
   {round&&(phase==='idle'||phase==='finished')&&<div className="space-y-3">
    <p className="text-sm">{phase==='finished'?(round.count!<2?'Não houve duas respostas. Nada foi revelado.':'Rodada encerrada. O papo pode continuar!'):'Responda uma pergunta leve, tente adivinhar quem respondeu e descubra afinidades.'}</p>
    <p className="text-xs text-dark-300">60s para responder · 45s para adivinhar · 2min para descobrir. São necessárias duas respostas.</p>
    <button className={button+' bg-primary-500/20'} disabled={disabled||(phase==='finished'&&seconds>0)} onClick={()=>void run({action:'start'})}>{phase==='finished'&&seconds>0?`Próxima rodada em ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:'Propor uma rodada'}</button>
   </div>}
   {active&&<>
    <div className="flex items-start justify-between gap-3 mb-3"><h3 className="font-semibold">{round?.question}</h3><span className="text-xs shrink-0 text-dark-300">{seconds}s</span></div>
    {phase==='answering'&&<>
     <p role="status" className="text-xs text-dark-300 mb-2">{round?.count||0}/24 respostas · O apelido será revelado no final.</p>
     {round?.ownAnswer?<div className="space-y-2"><p className="text-sm break-words">Sua resposta: {round.ownAnswer}</p><button className={button} disabled={disabled||seconds===0} onClick={()=>void run({action:'withdraw',roundId:round.id})}>Retirar minha resposta</button></div>:<form onSubmit={e=>{e.preventDefault();void run({action:'answer',roundId:round?.id,text:text.trim()})}}>
      <label htmlFor="icebreaker-answer" className="text-xs">Sua resposta (até 160 caracteres)</label>
      <textarea id="icebreaker-answer" value={text} onChange={e=>setText(e.target.value)} maxLength={160} rows={2} className="w-full mt-1 rounded-xl p-3 bg-white/5 border border-white/15 text-sm" placeholder="Escreva algo que queira compartilhar…" />
      <div className="flex flex-wrap items-center gap-2 mt-2"><button className={button+' bg-primary-500/20'} disabled={disabled||!text.trim()||seconds===0}>Enviar e participar</button><button type="button" className={button} onClick={()=>setOpen(false)}>Só acompanhar o chat</button></div>
     </form>}
    </>}
    {phase==='guessing'&&<p className="text-xs text-dark-300 mb-3">De quem é cada resposta? Seus palpites ficam só neste aparelho. Sem pontos ou ranking.</p>}
    {phase==='revealed'&&<p className="text-xs text-dark-300 mb-3">Descobriram algo em comum? Marquem “Eu também!” e continuem a conversa no chat.</p>}
    <div className="grid gap-2 sm:grid-cols-2">{round?.answers?.filter(a=>!a.userId||!blocked.has(a.userId)).map(a=><article key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-3 min-w-0">
     <p className="text-sm break-words">“{a.text}”</p>
     {phase==='guessing'&&<select aria-label={`De quem é a resposta: ${a.text}`} value={guesses[a.id]||''} onChange={e=>setGuesses(g=>({...g,[a.id]:e.target.value}))} className="mt-2 w-full bg-dark-900 border border-white/15 rounded-lg p-2 text-sm"><option value="">Meu palpite…</option>{round.candidates?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}
     {phase==='revealed'&&<div className="mt-2 space-y-2"><p className="text-xs text-primary-200 break-words">{a.username}{a.isMine?' (você)':''}{guesses[a.id]===a.userId?' · Você acertou!':''}</p><button className={button} aria-pressed={!!a.reacted} disabled={disabled||a.isMine||a.reacted||seconds===0} onClick={()=>void run({action:'react',roundId:round.id,answerId:a.id})}>{a.reacted?'✓ Eu também!':'Eu também!'} {a.meToo?`· ${a.meToo}`:''}</button></div>}
    </article>)}</div>
    {seconds===0&&<p className="text-xs mt-2 text-dark-300" role="status">Atualizando a etapa…</p>}
   </>}
  </div>}
 </section>
}
