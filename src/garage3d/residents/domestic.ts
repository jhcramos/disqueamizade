import {areaAt} from '../areas.ts';
import {houseRoute,houseWalkable,type Place} from '../layout.ts';
import {HOUSEHOLD,type HouseholdSpot} from './household.ts';
import type {LifeState,Resident,Visitor} from './model.ts';

type Host='dora'|'teo';
export type DomesticBeat={owner:Host;text:string;kind?:'thought';spot:HouseholdSpot;task?:'dishes'|'laundry'|'guitar'|'mow';duration?:number};
const beat=(owner:Host,text:string,spot:HouseholdSpot,task?:DomesticBeat['task'],kind?:'thought'):DomesticBeat=>({owner,text,spot,task,kind});
/** Chore destinations/actions are authored; the model may only vary these short lines. */
export const EPISODES:{title:string;beats:DomesticBeat[]}[]=[
 {title:'O solo da louça',beats:[
  beat('dora','Harold, eu lavei, estendi e guardei. Estou trabalhando mais nesta casa que a máquina de lavar!','kitchen','dishes'),
  beat('teo','Eu também trabalhei. Passei vinte minutos procurando a esponja que estava na minha mão.','kitchen'),
  beat('dora','Então usa essa experiência toda e assume a louça. Inclusive a panela, senhor artista.','kitchen'),
  beat('teo','Protesto! Vou compor um blues chamado A Panela Não É Minha. Depois eu lavo.','guitar','guitar'),
  beat('teo','Eu devia viajar sozinho e mudar o mundo… mas quem me lembraria de levar o carregador?','guitar','guitar','thought'),
  beat('dora','Belo solo. A panela pediu bis. Eu pedi parceria.','guitar'),
  beat('teo','Tem razão, meu amor. Hoje a pia é minha. E amanhã também: parceria tem escala.','kitchen','dishes'),
  beat('dora','É por isso que eu te amo. Agora sim essa casa está afinada.','kitchen'),
 ]},
 {title:'A sociedade das meias',beats:[
  beat('dora','Eu dobrei a roupa toda. Você pode guardar sem inaugurar outra pilha na cadeira?','laundry','laundry'),
  beat('teo','Aquilo não é uma pilha. É meu arquivo vertical de camisetas.','laundry','laundry'),
  beat('dora','Seu arquivo está ocupando o lugar das pessoas. Eu quero companhia, não um museu de bermudas.','laundry'),
  beat('teo','Está bem: roupa guardada, e agora eu cuido do jardim. As meias ficam sem advogado.','garden','mow'),
  beat('teo','Se eu mudar o mundo, começo pela grama. Pela primeira vez meu plano tem uma direção.','garden','mow','thought'),
  beat('dora','Olha só, trabalhando sem eu fazer uma apresentação em slides! Quer um café depois?','garden'),
  beat('teo','Quero. Reclamo da roupa, mas não troco nossa bagunça por nenhuma viagem sozinho.','garden'),
  beat('dora','Também te amo, rabugento. Café para dois e carinho para Layla.','garden'),
 ]},
 {title:'Revolução antes do café',beats:[
  beat('teo','Jana, tive uma ideia para mudar o mundo. Uma turnê de guitarra com uma mala só!','living'),
  beat('dora','Excelente. Antes da turnê, muda o lixo de lugar. Da cozinha para fora.','living'),
  beat('teo','Todo visionário enfrenta resistência. No meu caso, uma sacola de lixo.','living'),
  beat('dora','Eu não sou sua equipe de bastidores. Divide as tarefas comigo e sobra tempo para sonhar junto.','living'),
  beat('teo','Podia viajar sozinho… ia sentir falta até dessa bronca. Melhor comprar duas passagens.','living',undefined,'thought'),
  beat('teo','Combinado. Eu cuido da louça, você escolhe o roteiro. Depois a gente toca para o pessoal.','kitchen','dishes'),
  beat('dora','Fechado. Você me tira do sério, mas também tira os melhores sorrisos.','kitchen'),
  beat('teo','A próxima música é sua. E quem chegar pode sugerir a trilha desta casa.','guitar','guitar'),
 ]},
];
export type DomesticState={version:1;episode:number;cycle:number;id:string;beat:number;phase:'idle'|'gather'|'speak'|'pause';until:number;deadline:number;points?:[Place,Place];lines?:string[];generatedBy?:string;taskMoved?:boolean};
export const freshDomestic=(now:number,cycle=0):DomesticState=>({version:1,episode:cycle%EPISODES.length,cycle,id:`home:${now}:${cycle}`,beat:0,phase:'idle',until:now+9000,deadline:now+9000});
const dist=(a:Place,b:Place)=>Math.hypot(a.x-b.x,a.z-b.z);
const hosts=(s:LifeState)=>[s.residents.find(r=>r.id==='dora')!,s.residents.find(r=>r.id==='teo')!] as [Resident,Resident];
export function interruptDomestic(s:LifeState,now:number){
 const d=s.domestic;if(!d||d.phase==='idle')return;
 for(const r of hosts(s))if(r.target==='domestic'){r.target=undefined;r.path=[];r.activity='idle';r.until=now+5000;}
 if(s.speech?.episode===d.id)delete s.speech;
 s.domestic={...freshDomestic(now,d.cycle+1),until:now+35000};
}
function finish(s:LifeState,now:number){
 const d=s.domestic!;s.memories=[...s.memories,`Jana e Harold resolveram juntos: ${EPISODES[d.episode].title}.`].slice(-12);
 interruptDomestic(s,now);
}
function pairAt(anchor:Place,actors:[Resident,Resident],visitors:Visitor[]):[Place,Place]|null{
 const candidates=[anchor,...Array.from({length:24},(_,i)=>({x:anchor.x+Math.sin(i*Math.PI/12)*1.15,z:anchor.z+Math.cos(i*Math.PI/12)*1.15}))];
 const free=candidates.filter(p=>houseWalkable(p)&&areaAt(p)?.id===areaAt(anchor)?.id&&visitors.every(v=>dist(v.position,p)>.65));
 // Harold uses the prop's authored floor position, Jana gets a separate standing place.
 for(const h of free)for(const j of free){if(dist(h,j)<.95||dist(h,j)>1.8)continue;
  const a=houseRoute(actors[0].position,j),b=houseRoute(actors[1].position,h);
  if(a.length&&b.length)return[j,h];
 }return null;
}
function startBeat(s:LifeState,visitors:Visitor[],now:number){
 const d=s.domestic!,b=EPISODES[d.episode].beats[d.beat],actors=hosts(s);
 const points=pairAt(HOUSEHOLD[b.spot],actors,visitors);
 if(!points){interruptDomestic(s,now);return;}
 delete d.taskMoved;d.points=points;d.phase='gather';d.deadline=now+90000;d.until=now;
 actors.forEach((r,i)=>{r.target='domestic';r.path=dist(r.position,points[i])<.10?[]:houseRoute(r.position,points[i]);r.activity=r.path.length?'walk':'chat';r.until=d.deadline;});
}
/** Advance a shared scene once. Walking still uses the existing collision and gait code. */
export function tickDomestic(s:LifeState,visitors:Visitor[],now:number):Set<string>{
 s.domestic??=freshDomestic(now);const d=s.domestic,actors=hosts(s);
 if(d.phase!=='idle'&&(d.phase==='speak'||d.beat>0)&&s.speech&&s.speech.until>now&&s.speech.episode!==d.id){interruptDomestic(s,now);return new Set();}
 if(d.phase==='idle'){
  if(now<d.until||s.speech&&s.speech.until>now||actors.some(r=>['drink','greet','dance'].includes(r.activity)&&r.until>now)||s.items.some(i=>i.holder==='dora'||i.holder==='teo'))return new Set();
  // Release the old routine's reservations, never a visitor's item.
  for(const item of s.items)if(item.reserved==='dora'||item.reserved==='teo')item.reserved=undefined;
  startBeat(s,visitors,now);
 }else if(actors.some(r=>r.target!=='domestic')){interruptDomestic(s,now);return new Set();}
 const current=s.domestic!;if(current.phase==='idle')return new Set();
 if(now>current.deadline){interruptDomestic(s,now);return new Set();}
 const b=EPISODES[current.episode].beats[current.beat];
 if(current.phase==='gather'){
  if(actors.some((r,i)=>r.path.length||dist(r.position,current.points![i])>.18))return new Set(['dora','teo']);
  if(dist(actors[0].position,actors[1].position)>2.4){interruptDomestic(s,now);return new Set();}
  if(s.speech&&s.speech.until>now)return new Set(['dora','teo']);
  for(const r of actors){const other=actors.find(a=>a!==r)!;r.angle=Math.atan2(other.position.x-r.position.x,other.position.z-r.position.z);r.activity=r.id===b.owner&&b.task?b.task:'chat';}
  if(b.task==='mow')actors[1].angle+=Math.PI; // Keep the mower clear of Jana while Harold works.
  const text=current.lines?.[current.beat]??b.text;
  const duration=Math.max(7800,Math.min(11500,text.length*55));
  s.speech={owner:b.owner,text,until:now+duration,kind:b.kind??'speech',episode:current.id,...(current.lines?{generatedBy:current.generatedBy}:{})};
  current.phase='speak';current.until=now+duration+(b.task?3000:1200);current.deadline=current.until+15000;
  actors.forEach(r=>r.until=current.deadline);
 }else if(current.phase==='speak'&&b.task==='mow'&&!current.taskMoved&&s.speech?.episode===current.id&&now>=s.speech.until){
  current.taskMoved=true;
  const harold=actors[1],jana=actors[0],length=dist(harold.position,jana.position)||1;
  const end={x:harold.position.x+(harold.position.x-jana.position.x)/length*.65,z:harold.position.z+(harold.position.z-jana.position.z)/length*.65};
  if(houseWalkable(end)&&visitors.every(v=>dist(v.position,end)>.7)){harold.path=houseRoute(harold.position,end,visitors.map(v=>v.position));current.until=Math.max(current.until,now+2500);}
 }else if(current.phase==='speak'&&now>=current.until){
  current.beat++;
  if(current.beat>=EPISODES[current.episode].beats.length){finish(s,now);return new Set();}
  current.phase='pause';current.until=now+1200;current.deadline=now+25000;
 }else if(current.phase==='pause'&&now>=current.until){startBeat(s,visitors,now);}
 return new Set(['dora','teo']);
}
export function validDomestic(raw:unknown):raw is DomesticState{
 const d=raw as DomesticState;if(!d||d.version!==1||!Number.isInteger(d.episode)||!EPISODES[d.episode]||!Number.isSafeInteger(d.cycle)||d.cycle<0||typeof d.id!=='string'||d.id.length>80||!Number.isInteger(d.beat)||!EPISODES[d.episode].beats[d.beat]||!['idle','gather','speak','pause'].includes(d.phase)||![d.until,d.deadline].every(Number.isFinite))return false;
 if(d.taskMoved!==undefined&&typeof d.taskMoved!=='boolean')return false;
 if(d.points&&(!Array.isArray(d.points)||d.points.length!==2||d.points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.z)||!houseWalkable(p))||dist(...d.points)>2.4))return false;
 if(d.phase!=='idle'&&!d.points)return false;
 if(d.lines&&(!Array.isArray(d.lines)||d.lines.length!==EPISODES[d.episode].beats.length||d.lines.some(t=>typeof t!=='string'||!t.trim()||t.length>180)))return false;
 return d.generatedBy===undefined||d.generatedBy==='zai-org/GLM-5.3-Flash';
}
