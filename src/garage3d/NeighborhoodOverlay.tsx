import {Link} from 'react-router-dom';
import {ArrowUpRight,Footprints,Home,X} from 'lucide-react';
import {LAND_PRICE,NEIGHBORHOOD_LOTS,lotById} from './neighborhood';
type Props={overview:boolean;selected:string|null;nearby:string|null;frozen:boolean;labels:Map<string,HTMLButtonElement>;onSelect:(id:string)=>void;onVisit:(id:string)=>void;onInspect:(id:string)=>void;onClose:()=>void;onHome:()=>void};
export function NeighborhoodOverlay(p:Props){
 const lot=lotById(p.selected),near=lotById(p.nearby);
 return <>
  {p.overview&&NEIGHBORHOOD_LOTS.map(l=><button key={l.id} ref={el=>{if(el)p.labels.set(l.id,el);else p.labels.delete(l.id);}} className="neighborhood-lot-label" aria-label={`Conhecer lote ${l.id} · ${l.name} · R$ ${LAND_PRICE}`} onClick={()=>p.onSelect(l.id)}><span>Lote {l.id} · {l.name}</span><strong>R$ {LAND_PRICE}</strong></button>)}
  {p.overview&&<div className="neighborhood-navigation"><button onClick={p.onHome} disabled={p.frozen}><Home size={15}/>Voltar à casa</button><Link to="/vizinhanca" target="_blank" rel="noopener noreferrer">Conhecer o projeto <ArrowUpRight size={14}/></Link></div>}
  {lot?<section className="neighborhood-lot-card" aria-label={`Terreno ${lot.id}`}>
   <button className="neighborhood-close" aria-label="Fechar terreno" onClick={p.onClose}><X size={18}/></button>
   <small>SEU ESPAÇO NO DISQUE AMIZADE</small><h2>Lote {lot.id} · {lot.name}</h2>
   <p>Um terreno virtual para imaginar sua casa e reunir sua turma, pertinho da casa principal.</p>
   <strong className="neighborhood-lot-price">R$ {LAND_PRICE}<span> / terreno virtual</span></strong>
   <div className="neighborhood-lot-actions"><button disabled={p.frozen} onClick={()=>p.onVisit(lot.id)}><Footprints size={15}/>Passear até aqui</button><button onClick={()=>p.onInspect(lot.id)}>Ver de perto</button><Link to={`/vizinhanca?lote=${lot.id}`} target="_blank" rel="noopener noreferrer">Ver proposta e condições <ArrowUpRight size={16}/></Link></div>
  </section>:near&&<div className="neighborhood-nearby"><span>Lote {near.id} · {near.name}<small>Terreno virtual · R$ {LAND_PRICE}</small></span><button onClick={()=>p.onSelect(near.id)}>Conhecer</button></div>}
 </>;
}
