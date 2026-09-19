import {useState,useEffect} from 'react';
import {ACTIVITIES,TOPICS,SPOTS,COMPANY_CHOICES,ROOM_LABELS} from './concierge';
import type {LifeAction,LifeState} from './model';
type Props={message?:string;state:LifeState;visitor:string;seat?:string;host:string;disabled:boolean;onAction:(a:LifeAction,target:string,request?:string)=>void;onMeet:(id:string)=>void};
export function CompanyRequestForm(p:Props&{onMinimize?:()=>void;onPet?:()=>void}){
 const [choice,setChoice]=useState(''),[request,setRequest]=useState(''),[custom,setCustom]=useState(false),[sending,setSending]=useState(false);
 const current=p.state.social.concierge?.requests[p.visitor];const active=current&&current.expires>Date.now();
 useEffect(()=>{setSending(false);},[current?.id,p.message]);
 useEffect(()=>{if(!sending)return;const timeout=setTimeout(()=>setSending(false),8000);return()=>clearTimeout(timeout);},[sending]);
 if(p.state.social.solo[p.visitor])return <section className="company-waiting"><p>Você escolheu explorar sozinho. Quer voltar a receber apresentações?</p><button disabled={p.disabled} onClick={()=>p.onAction('socialOn',p.host)}>Quero receber apresentações</button></section>;
 if(active)return <section className="company-waiting" aria-label="Busca por companhia">
  <strong>{current.pending?'Procurando companhia…':'Vou avisar quando encontrar companhia'}</strong>
  <p role="status">{current.notice||'Pode continuar passeando. Seu pedido fica ativo por até 10 minutos.'}</p>
  <small>Seu pedido: {current.text}. Buscamos nos ambientes que você pode acessar.</small>
  <div><button onClick={p.onMinimize}>Continuar passeando</button><button disabled={p.disabled} onClick={()=>p.onAction('cancelCompany',p.host)}>Cancelar busca</button><button onClick={p.onPet}>Brincar com Biscoito</button></div>
 </section>;
 const text=custom?request.trim():choice;
 return <form className="company-request company-quick" onSubmit={e=>{e.preventDefault();if(!p.disabled&&!sending&&text.length>=3){setSending(true);p.onAction('askCompany',p.host,text);}}}>
  <fieldset disabled={p.disabled||sending}><legend>O que você topa agora?</legend><div className="company-choice-grid">{COMPANY_CHOICES.map(c=><button type="button" key={c.text} aria-pressed={!custom&&choice===c.text} onClick={()=>{setCustom(false);setChoice(c.text);}}><span aria-hidden="true">{c.symbol}</span><span>{c.text}{c.activity==='play'&&<small>Uma brincadeira com Biscoito</small>}</span></button>)}</div></fieldset>
  <button type="button" className="company-custom-toggle" aria-expanded={custom} onClick={()=>setCustom(!custom)}>Quer algo específico? Conte para {p.host==='dora'?'a Dora':'o Téo'}.</button>
  {custom&&<label>O que você tem vontade de fazer?<input value={request} maxLength={240} placeholder="Ex.: conversar sobre rock brasileiro" onChange={e=>setRequest(e.target.value)} disabled={p.disabled||sending}/><small>Este pedido é analisado por IA e não aparece no chat.</small></label>}
  <button className="company-submit" disabled={p.disabled||sending||text.length<3}>{sending?'Procurando…':'Encontrar companhia'}</button>
  <small>Buscamos na casa toda. Você escolhe se aceita o encontro.</small>
 </form>;
}
export function CompanyWaiting({state,visitor,onOpen}:{state:LifeState;visitor:string;onOpen:(host:string)=>void}){
 const r=state.social.concierge?.requests[visitor];if(!r||r.expires<=Date.now())return null;
 return <button className="company-waiting-pill" onClick={()=>onOpen(r.host)} aria-label="Ver busca por companhia"><span aria-hidden="true">✦</span> Procurando companhia <small>Ver pedido</small></button>;
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
 if(circle&&!proposal)return <aside className="host-invitation company-suggestion" aria-label="Sua roda"><strong>{SPOTS.find(s=>s.id===circle.spot)?.name} · {circle.members.length}/4</strong><p>{ROOM_LABELS[circle.room]} · {ACTIVITIES[circle.activity]}</p><p>{TOPICS[circle.topic]}</p><div><button disabled={p.disabled} onClick={()=>p.onMeet(circle.id)}>Ir para a roda</button><button onClick={()=>p.onAction('leaveCompany',circle.id)}>Encerrar minha participação</button></div><button className="company-minimize" aria-expanded={true} onClick={()=>setExpanded(false)}>Recolher</button><small>Encontro combinado com {circle.members.filter(m=>m.id!==p.visitor).map(m=>m.name).join(', ')||'você'}. Câmera e microfone continuam desligados.</small></aside>;
 const v=proposal!,own=v.from===p.visitor,review=v.stage==='review';
 return <aside className="host-invitation company-suggestion" aria-label="Sugestão dos anfitriões"><strong>{v.host==='dora'?'Dora':'Téo'} encontrou uma possibilidade</strong><p>{v.line??`Que tal ${ACTIVITIES[v.activity].toLowerCase()}?`}</p><p><b>{SPOTS.find(s=>s.id===v.spot)?.name}</b> · {ROOM_LABELS[SPOTS.find(s=>s.id===v.spot)!.room]} · {v.circle?'Uma roda com vaga':`Com ${own?v.toName:v.fromName}`}</p><p>{TOPICS[v.topic]}</p><div>{review||!own?<button disabled={p.disabled} onClick={()=>p.onAction('acceptCompany',v.id)}>{review?'Gostei, enviar convite':'Aceitar encontro'}</button>:<span>Aguardando {v.toName} aceitar…</span>}<button onClick={()=>p.onAction('declineCompany',v.id)}>{own&&!review?'Cancelar convite':'Agora não'}</button></div><small>Roda aberta para até 4 pessoas; quem inicia aprova novas entradas. Movimento e câmera só quando você escolher.</small></aside>;
}
