import {useState} from 'react';
import type {NearbyHost} from './proximity';
export function NearbyHostPrompt({host,disabled,onDismiss,onOpen,onRequest}:{host:NearbyHost;disabled:boolean;onDismiss:()=>void;onOpen:()=>void;onRequest:(text:string)=>void}){
 const [activities,setActivities]=useState(false);const name=host==='dora'?'Dora':'Téo';
 return <aside className="nearby-host-prompt" aria-label={`Conversar com ${name}`} onPointerDown={e=>e.stopPropagation()}>
  <div className="nearby-host-heading"><strong>{name} <small>· {host==='dora'?'anfitriã':'anfitrião'} virtual</small></strong><button aria-label="Dispensar saudação" onClick={onDismiss}>×</button></div>
  <p aria-live="polite">{activities?'Tem música, um papo tranquilo ou uma brincadeira com o Biscoito. O que combina com você?':host==='dora'?'Oi! Tudo bem por aí? Quer companhia ou está só passeando?':'Opa, tudo bem? Quer conhecer a turma ou descobrir o que tem pra fazer?'}</p>
  <div className="nearby-host-choices">{activities?<><button disabled={disabled} onClick={()=>onRequest('Ouvir música juntos')}>Curtir música</button><button disabled={disabled} onClick={()=>onRequest('Papo tranquilo')}>Papo tranquilo</button><button disabled={disabled} onClick={()=>onRequest('Jogar ou brincar')}>Brincar com Biscoito</button><button onClick={()=>setActivities(false)}>Voltar</button></>:<><button disabled={disabled} onClick={onOpen}>Quero companhia</button><button onClick={()=>setActivities(true)}>O que tem pra fazer?</button><button onClick={onDismiss}>Só passeando</button></>}</div>
 </aside>;
}
