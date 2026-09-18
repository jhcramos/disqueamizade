import {HostInvitation} from './HostInvitation';
import { ITEMS,NAMES,heldItem,options,type LifeAction,type LifeState,type ResidentId } from './model';
import type { Connection } from './transport';
import './residents.css';
type Props={state:LifeState;visitor:string;selected:string|null;mode:Connection;disabled:boolean;message:string;muted:boolean;onMute:()=>void;onMeet:(id:string)=>void;onSelect:(id:string|null)=>void;onAction:(action:LifeAction,target:string)=>void};
export function ResidentPanel(p:Props){const held=heldItem(p.state,p.visitor),title=p.selected==='bed'?'Caminha do Biscoito':p.selected==='bowl'?'Potinho de água':p.selected==='plant'?'Planta da sala':NAMES[p.selected as ResidentId]??ITEMS[p.selected as keyof typeof ITEMS]?.name;
 return <div className="resident-controls" onPointerDown={e=>e.stopPropagation()}>
  <HostInvitation state={p.state} visitor={p.visitor} disabled={p.disabled} onAction={p.onAction} onMeet={p.onMeet}/>
  {!p.selected?<button className="resident-open" onClick={()=>p.onSelect(p.state.bed.holder===p.visitor?'bed':'biscoito')}>♧ Moradores e objetos{p.state.bed.holder===p.visitor?' · carregando caminha':held?` · ${ITEMS[held.id].name}`:''}</button>:<section className="resident-panel" aria-label="Moradores e objetos">
   <header><div><small>VIDA NA CASA</small><strong>{title}</strong></div><button onClick={()=>p.onSelect(null)} aria-label="Fechar interações">×</button></header>
   <label className="resident-picker">Encontrar <select value={p.selected} onChange={e=>p.onSelect(e.target.value)}>{Object.entries(NAMES).map(([id,name])=><option key={id} value={id}>{name} · morador virtual</option>)}{Object.entries(ITEMS).map(([id,item])=><option key={id} value={id}>{item.name}</option>)}<option value="plant">Planta da sala</option><option value="bed">Caminha do Biscoito</option><option value="bowl">Potinho de água</option></select></label>
   <p className="resident-hint">{p.selected==='bed'?(p.state.bed.holder===p.visitor?'Caminhe até um piso livre e toque em “Colocar caminha aqui”.':'Mude a caminha de lugar ou convide Biscoito para descansar.'):p.selected==='biscoito'?held?.id==='toy'?'Biscoito está de olho na sua bolinha. Jogue ou convide alguém para a próxima vez.':'Pegue a bolinha para brincar de buscar, ou chegue perto para fazer carinho.':p.selected==='dora'||p.selected==='teo'?'Quer companhia? A gente apresenta vocês e depois deixa o papo acontecer.':p.selected==='plant'||p.selected==='bowl'?'Pegue o regador para cuidar da casa.':'Toque em uma ação. Seu avatar vai até lá.'}</p>
   <div className="resident-buttons">{options(p.state,p.selected,p.visitor).map(o=><button disabled={p.disabled||p.mode==='connecting'||p.mode==='reconnecting'} key={o.action} onClick={()=>p.onAction(o.action,p.selected!)}>{o.label}</button>)}{!options(p.state,p.selected,p.visitor).length&&<span>{p.selected==='biscoito'?'Biscoito está buscando a bolinha.':held?'Você já está carregando um objeto.':'Pegue o objeto necessário ou espere ele ficar livre.'}</span>}{held&&p.selected!==held.id&&<button disabled={p.disabled} onClick={()=>p.onAction('return',held.id)}>Guardar {ITEMS[held.id].name.toLowerCase()}</button>}</div>
   <p role="status" className="resident-result">{p.message}</p>
   <footer><span>{p.mode==='local'?'Brincadeiras nesta visita · falas preparadas':p.mode==='online'?'Moradores compartilhados':'Conectando os moradores…'}</span><button onClick={p.onMute}>{p.muted?'Mostrar falas':'Ocultar falas'}</button></footer>
  </section>}
 </div>;
}
