import {useState,useEffect} from 'react';
import {ACTIVITIES,TOPICS,SPOTS} from './concierge';
import type {LifeAction,LifeState} from './model';
type Props={state:LifeState;visitor:string;seat?:string;host:string;disabled:boolean;onAction:(a:LifeAction,target:string,request?:string)=>void;onMeet:(id:string)=>void};
export function CompanyRequestForm(p:Props){
 const [request,setRequest]=useState('');const current=p.state.social.concierge?.requests[p.visitor];
 const pending=!!current?.pending;
 return <form className="company-request" onSubmit={e=>{e.preventDefault();if(!p.disabled&&request.trim().length>=3)p.onAction('askCompany',p.host,request);}}>
  <label htmlFor="company-request">O que você tem vontade de fazer?</label>
  <input id="company-request" value={request} maxLength={240} placeholder="Um papo tranquilo, música, brincar…" onChange={e=>setRequest(e.target.value)} disabled={p.disabled||pending}/>
  <small>Seu pedido ajuda a combinar encontros por 10 minutos. Não aparece no chat. A análise usa IA.</small>
  <div><button disabled={p.disabled||pending||request.trim().length<3}>{pending?'Procurando…':'Encontrar companhia'}</button>{current&&<button type="button" onClick={()=>p.onAction('cancelCompany',p.host)}>Cancelar pedido</button>}</div>
  {current?.notice&&<p role="status">{current.notice}</p>}
 </form>;
}
export function CompanySuggestion(p:Omit<Props,'host'>){
 const c=p.state.social.concierge;
 const circle=c?.circles.find(c=>c.members.some(m=>m.id===p.visitor));
 const [expanded,setExpanded]=useState(true);
 const arrived=!!circle&&circle.members.find(m=>m.id===p.visitor)?.seat===p.seat;
 useEffect(()=>{setExpanded(!arrived);},[circle?.id,arrived]);
 const proposal=c?.proposals.find(v=>v.expires>Date.now()&&(v.from===p.visitor||(v.to===p.visitor&&v.stage==='invited')));
 if(!proposal&&!circle)return null;
 if(circle&&!proposal&&!expanded)return <aside className="host-invitation company-compact" aria-label="Sua roda"><button aria-expanded={false} onClick={()=>setExpanded(true)}>{SPOTS.find(s=>s.id===circle.spot)?.name} · {circle.members.length}/4 · Ver encontro</button></aside>;
 if(circle&&!proposal)return <aside className="host-invitation company-suggestion" aria-label="Sua roda"><strong>{SPOTS.find(s=>s.id===circle.spot)?.name} · {circle.members.length}/4</strong><p>{ACTIVITIES[circle.activity]}</p><p>{TOPICS[circle.topic]}</p><div><button disabled={p.disabled} onClick={()=>p.onMeet(circle.id)}>Ir para a roda</button><button onClick={()=>p.onAction('leaveCompany',circle.id)}>Encerrar minha participação</button></div><button className="company-minimize" aria-expanded={true} onClick={()=>setExpanded(false)}>Recolher</button><small>Encontro combinado com {circle.members.filter(m=>m.id!==p.visitor).map(m=>m.name).join(', ')||'você'}. Câmera e microfone continuam desligados.</small></aside>;
 const v=proposal!,own=v.from===p.visitor,review=v.stage==='review';
 return <aside className="host-invitation company-suggestion" aria-label="Sugestão dos anfitriões"><strong>{v.host==='dora'?'Dora':'Téo'} encontrou uma possibilidade</strong><p>{v.line??`Que tal ${ACTIVITIES[v.activity].toLowerCase()}?`}</p><p><b>{SPOTS.find(s=>s.id===v.spot)?.name}</b> · {v.circle?'Uma roda com vaga':`Com ${own?v.toName:v.fromName}`}</p><p>{TOPICS[v.topic]}</p><div>{review||!own?<button disabled={p.disabled} onClick={()=>p.onAction('acceptCompany',v.id)}>{review?'Gostei, enviar convite':'Aceitar encontro'}</button>:<span>Aguardando {v.toName} aceitar…</span>}<button onClick={()=>p.onAction('declineCompany',v.id)}>{own&&!review?'Cancelar convite':'Agora não'}</button></div><small>Roda aberta para até 4 pessoas; quem inicia aprova novas entradas. Movimento e câmera só quando você escolher.</small></aside>;
}
