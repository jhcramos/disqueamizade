// Isolated UI fixture: no backend, authentication, camera or real participants.
import React from 'react'
import {createRoot} from 'react-dom/client'
import '../src/styles/index.css'
import {IcebreakerPanel} from '../src/rooms/icebreakers/IcebreakerPanel'
import type {Input,Round} from '../src/rooms/icebreakers/types'
if(!import.meta.env.DEV)throw new Error('Development fixture only')
let phase:Round['phase']='idle',own:string|null=null,reacted=false
const request=async(_room:string,input:Input):Promise<Round>=>{
 if(input.action==='start')phase='answering'
 if(input.action==='answer')own=input.text||null
 if(input.action==='withdraw')own=null
 if(input.action==='react')reacted=true
 const t=Date.now()
 return {id:'fixture',phase,serverNow:new Date(t).toISOString(),question:'Qual habilidade completamente inútil você tem?',count:own?2:1,ownAnswer:own,
 answerUntil:new Date(t+60000).toISOString(),guessUntil:new Date(t+45000).toISOString(),endAt:new Date(t+120000).toISOString(),nextAt:new Date(t+300000).toISOString(),
 candidates:[{id:'other',name:'Convidado de teste'},{id:'me',name:'Você'}],
 answers:phase==='guessing'||phase==='revealed'?[{id:'answer',text:'Reconheço novela pela abertura.',...(phase==='revealed'?{userId:'other',username:'Convidado de teste',reacted,meToo:reacted?1:0}:{})}]:undefined}
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><main className="bg-dark-950 text-white min-h-screen p-4"><h1>Teste isolado — sem pessoas reais</h1><nav className="flex gap-3 py-4">{(['answering','guessing','revealed','finished'] as const).map(p=><button key={p} onClick={()=>{phase=p;document.dispatchEvent(new Event('visibilitychange'))}}>{p}</button>)}</nav><div className="max-w-3xl border border-white/10 rounded-xl overflow-hidden"><div className="h-40 flex items-center justify-center bg-dark-900 text-dark-400">Área de vídeo ilustrativa</div><IcebreakerPanel roomId="fixture" identity="me" connected blocked={new Set()} request={request}/></div></main></React.StrictMode>)
