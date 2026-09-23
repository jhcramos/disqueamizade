import {findThrowTarget} from './throwTarget.ts';
import {freshSocial,validSocial,hostCommand,tickSocial,HOST_ACTIONS,type HostSocial} from './social.ts';
import { areaById, planPoint, OPENINGS } from '../areas.ts';
import { roomAt, houseRoute, houseWalkable, type Place } from '../layout.ts';
export type ResidentId = 'dora' | 'teo' | 'biscoito';
export type ItemId = 'coffee' | 'watering' | 'record' | 'toy';
export type Visitor = { adult?:boolean; seat?:string; id:string; name:string; position:Place; frozen?:boolean; available?:boolean; publicId?:string; blocked?:string[] };
export type Resident = {id:ResidentId; position:Place; angle:number; activity:string; path:Place[]; until:number; step:number; target?:string};
export type BallFlight={from:Place;to:Place;start:number;duration:number;fromHeight:number;toHeight:number};
export type Item = {id:ItemId; kind:ItemId; position:Place; height:number; holder?:string; reserved?:string;flight?:BallFlight};
export type LifeState = {version:1; layoutVersion:3; social:HostSocial; bed:{position:Place;home:Place;holder?:string}; residents:Resident[]; items:Item[]; memories:string[]; speech?:{owner:ResidentId;text:string;until:number;generatedBy?:string}; cooldown:Record<string,number>; watered:number; coffees:number; dances:number; fetches:number};
export const NAMES:Record<ResidentId,string>={dora:'Dora',teo:'Téo',biscoito:'Layla'};
export const ITEMS:Record<ItemId,{name:string;position:Place;height:number}>={
 coffee:{name:'Café da casa',position:planPoint(464,356),height:.55},
 watering:{name:'Regador',position:planPoint(282,480),height:.01},
 record:{name:'Disco de vinil',position:planPoint(907,543),height:1.12},
 toy:{name:'Bolinha da Layla',position:planPoint(475,470),height:.14},
};
export const PLANT:Place=planPoint(272,491);
export const BED:Place=planPoint(450,460);
export const BOWL:Place=planPoint(425,492);
export type LifeAction = 'askCompany'|'cancelCompany'|'acceptCompany'|'declineCompany'|'leaveCompany'|'pick'|'return'|'coffee'|'water'|'record'|'throw'|'pet'|'greet'|'fill'|'rest'|'talk'|'moveBed'|'placeBed'|'cancelBed'|'introduce'|'together'|'solo'|'socialOn'|'passToy'|'acceptHost'|'declineHost'|'dismissHost';
export type Command={id:string;visitor:Visitor;action:LifeAction;target:string;request?:string};
const distance=(a:Place,b:Place)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createLife(now=Date.now()):LifeState{return{version:1,layoutVersion:3,social:freshSocial(),bed:{position:{...BED},home:{...BED}},residents:[
 {id:'dora',position:planPoint(493,445),angle:0,activity:'idle',path:[],until:now+12000,step:0},
 {id:'teo',position:{...areaById('garage').arrival},angle:0,activity:'idle',path:[],until:now+16000,step:0},
 {id:'biscoito',position:planPoint(477,451),angle:0,activity:'idle',path:[],until:now+20000,step:0},
],items:(Object.keys(ITEMS) as ItemId[]).map(id=>({id,kind:id,position:{...ITEMS[id].position},height:ITEMS[id].height})),memories:[],cooldown:{},watered:0,coffees:0,dances:0,fetches:0};}
export function remember(s:LifeState,text:string){s.memories=[...s.memories,text].slice(-12);}
export function speak(s:LifeState,owner:ResidentId,text:string,now:number){s.speech={owner,text,until:now+7500};}
export function targetPosition(s:LifeState,id:string):Place|undefined{
 if(id==='plant')return PLANT;if(id==='bed')return s.bed.position;if(id==='bowl')return BOWL;
 return s.residents.find(r=>r.id===id)?.position??s.items.find(i=>i.id===id)?.position;
}
/** Reachable standing point outside an object/actor, never a coordinate invented by a model. */
export function approach(from:Place,target:Place,others:Place[]=[]):Place[]{
 const candidates=Array.from({length:16},(_,i)=>({x:target.x+Math.sin(i*Math.PI/8)*.82,z:target.z+Math.cos(i*Math.PI/8)*.82})).filter(houseWalkable).sort((a,b)=>distance(a,from)-distance(b,from));
 for(const p of candidates){const path=houseRoute(from,p,others);if(path.length)return path;}
 return [];
}
export function heldItem(s:LifeState,visitor:string){return s.items.find(i=>i.holder===visitor);}
export function options(s:LifeState,target:string,visitor:string):{action:LifeAction;label:string}[]{
 const held=heldItem(s,visitor),item=s.items.find(i=>i.id===target);
 if(s.bed.holder===visitor&&target!=='bed')return [];
 if(item)return item.holder===visitor?[{action:'return',label:'Guardar no lugar'}]:!item.holder&&!item.reserved&&!held?[{action:'pick',label:`Pegar ${target==='coffee'?'café':target==='watering'?'regador':target==='record'?'disco':'bolinha'}`}]:[];
 if(target==='bed'){if(s.bed.holder)return s.bed.holder===visitor?[{action:'placeBed',label:'Colocar caminha aqui'},{action:'cancelBed',label:'Devolver ao lugar anterior'}]:[];return [...(!['fetch','bring'].includes(s.residents[2].activity)?[{action:'rest' as const,label:'Chamar Layla para descansar'}]:[]),...(!held?[{action:'moveBed' as const,label:'Mover caminha'}]:[])];}
 if(target==='bowl')return held?.id==='watering'?[{action:'fill',label:'Encher o potinho'}]:[];
 if(target==='plant')return held?.id==='watering'?[{action:'water',label:'Regar a planta'}]:[];
 if(target==='biscoito'&&['fetch','bring'].includes(s.residents[2].activity))return [];
 if(target==='biscoito')return[...(held?.id==='toy'?[{action:'throw' as const,label:'Jogar bolinha para Layla'},{action:'passToy' as const,label:'Passar a vez'}]:[]),{action:'pet',label:'Fazer carinho'},{action:'talk',label:'O que foi, Layla?'}];
 if(target==='dora'||target==='teo')return[{action:'introduce',label:'Me apresente alguém'},{action:'together',label:'Vamos fazer algo juntos'},{action:s.social.solo[visitor]?'socialOn':'solo',label:s.social.solo[visitor]?'Voltar a receber convites':'Quero explorar sozinho'},{action:'greet',label:'Dar um toque de mãos'},...(held?.id==='coffee'?[{action:'coffee' as const,label:'Oferecer café'}]:[]),...(held?.id==='record'?[{action:'record' as const,label:'Entregar disco e dançar'}]:[])];
 return [];
}
export const residentSpeed=(id:ResidentId)=>id==='dora'?.78:id==='teo'?.96:1.32;
export const residentPause=(id:ResidentId,step:number)=>({dora:11000,teo:7400,biscoito:5300}[id])+((step*1733+{dora:217,teo:1301,biscoito:941}[id])%5100);
// Keep the hall, lounge doors and cinema/garage passages clear of movable beds.
const BED_PASSAGES:Place[]=OPENINGS.filter(o=>o.kind==='door');
/** Check the cushion's full footprint and the current house's connecting doors. */
export function bedFits(p:Place){return Number.isFinite(p.x)&&Number.isFinite(p.z)&&[[0,0],[-.49,-.37],[-.49,.37],[.49,-.37],[.49,.37]].every(([x,z])=>houseWalkable({x:p.x+x,z:p.z+z}))&&BED_PASSAGES.every(door=>distance(p,door)>1.15);}
export function releaseBed(s:LifeState,visitor:string){if(s.bed.holder===visitor){s.bed.holder=undefined;s.bed.position={...s.bed.home};}}
export function returnItem(item:Item){delete item.flight;item.holder=undefined;item.reserved=undefined;item.position={...ITEMS[item.id].position};item.height=ITEMS[item.id].height;}
export function applyCommand(s:LifeState,c:Command,now=Date.now(),visitors:Visitor[]=[c.visitor]):string{
 if(HOST_ACTIONS.has(c.action)){if(c.visitor.frozen&&! ['solo','declineHost','dismissHost','cancelCompany','declineCompany','leaveCompany'].includes(c.action))return 'Termine sua conversa antes de aceitar outro convite.';return hostCommand(s,c,visitors,now);}
 const v=c.visitor,p=targetPosition(s,c.target);
 if(!v||!v.id||v.id.length>100||!Number.isFinite(v.position.x)||!Number.isFinite(v.position.z)||v.frozen)return 'Espere terminar a conversa para brincar.';
 if((s.cooldown[v.id]??0)>now&&!['placeBed','cancelBed'].includes(c.action))return 'Só um instante…';
 if(!p||(distance(v.position,p)>1.5&&!(s.bed.holder===v.id&&['placeBed','cancelBed'].includes(c.action))))return 'Chegue mais perto para interagir.';
 if(!options(s,c.target,v.id).some(o=>o.action===c.action))return 'Esse objeto já está em uso. Escolha outra brincadeira.';
 const held=heldItem(s,v.id),r=s.residents.find(a=>a.id===c.target),name=v.name.trim().slice(0,24)||'Visitante';
 if(c.action==='moveBed'){
  const dog=s.residents.find(r=>r.id==='biscoito')!;
  s.bed.holder=v.id;s.bed.home={...s.bed.position};
  if(dog.activity==='rest'||dog.target==='bed'){dog.activity='idle';dog.path=[];dog.until=now+7000;dog.target=undefined;}
  speak(s,'biscoito','Mudança? Exijo uma janela com vista para os petiscos.',now);
 }
 if(c.action==='placeBed'){
  if(!bedFits(v.position)||s.residents.some(a=>distance(a.position,v.position)<.7))return 'Escolha um piso livre, longe dos móveis, passagens e moradores.';
  s.bed.position={...v.position};s.bed.home={...v.position};s.bed.holder=undefined;
  remember(s,`${name} mudou a caminha da Layla.`);speak(s,'biscoito','Imóvel aprovado. Agora só falta o serviço de quarto!',now);
 }
 if(c.action==='cancelBed')releaseBed(s,v.id);
 if(c.action==='talk'){const n=(s.cooldown['dog-lines']??0)%DOG_LINES.length;speak(s,'biscoito',DOG_LINES[n],now);s.cooldown['dog-lines']=(n+1)%DOG_LINES.length;}
 if(c.action==='pick'){const item=s.items.find(i=>i.id===c.target)!;item.holder=v.id;item.position={...v.position};item.height=.9;}
 if(c.action==='return'){const item=s.items.find(i=>i.id===c.target)!;if(distance(v.position,ITEMS[item.id].position)>1.5)return 'Leve o objeto de volta ao lugar dele.';returnItem(item);}
 if(r&&c.action!=='throw'&&c.action!=='pet'){s.items.filter(i=>i.holder===r.id||i.reserved===r.id).forEach(returnItem);r.target=undefined;}
 if(c.action==='coffee'&&held&&r){held.holder=r.id;held.reserved=r.id;r.activity='drink';r.path=[];r.until=now+8000;s.coffees++;speak(s,r.id,s.coffees===1?'Café entregue! Agora a fofoca tem acompanhamento.':'Mais café? Esta casa vai virar uma reunião de condomínio!',now);remember(s,`${name} ofereceu café a ${NAMES[r.id]}.`);}
 if(c.action==='record'&&held&&r){held.holder=r.id;held.reserved=r.id;r.activity='dance';r.path=[];r.until=now+9000;s.dances++;speak(s,r.id,'Você escolheu o disco, eu entro com o passinho!',now);remember(s,`${name} trouxe um disco para ${NAMES[r.id]}.`);}
 if(c.action==='water'&&held){s.watered++;const d=s.residents[0];speak(s,d.id,s.watered===1?'Obrigada! Téo achou que planta de sala vivia de conversa.':'Pronto, ela já bebeu. Vamos deixar um pouco para amanhã!',now);remember(s,`${name} cuidou da planta.`);}
 if(c.action==='fill'&&held){remember(s,`${name} colocou água para Layla.`);speak(s,'dora','Obrigada! Layla já estava de olho no meu café.',now);}
 if(c.action==='rest'){const dog=s.residents[2];dog.path=houseRoute(dog.position,s.bed.position);dog.activity='walk';dog.until=now+20000;dog.target='bed';remember(s,`${name} preparou um descanso para Layla.`);}
 if(c.action==='pet'&&r){r.path=[];r.activity='pet';r.until=now+5500;r.angle=Math.atan2(v.position.x-r.position.x,v.position.z-r.position.z);speak(s,'biscoito','Pode continuar. Minha agenda de carinho está livre o dia inteiro.',now);remember(s,`Layla recebeu carinho de ${name}.`);}
 if(c.action==='greet'&&r){r.path=[];r.activity='greet';r.until=now+4500;r.angle=Math.atan2(v.position.x-r.position.x,v.position.z-r.position.z);speak(s,r.id,r.id==='dora'?'Chega mais! Se Téo pedir ajuda com uma invenção, me avisa.':'Bem-vindo! Estou oficialmente ocupado evitando tarefas.',now);}
 if(c.action==='throw'&&held&&r){
  const target=findThrowTarget(v.position,r.position,visitors.map(v=>v.position));
  const goal=target?.goal;
  if(!goal)return 'Aqui está apertado. Vamos brincar em um espaço livre.';
  held.flight={from:{...v.position},to:{...goal},start:now,duration:Math.round(1400+(target?.range??2)*240),fromHeight:.9,toHeight:.14};held.holder=undefined;held.reserved='biscoito';held.position=goal;held.height=.14;r.activity='fetch';r.target=v.id;r.path=target!.path;r.until=now+30000;s.fetches++;speak(s,'biscoito','Eu busco! Mas desta vez você promete não jogar de novo?',now);
 }
 s.cooldown[v.id]=now+1500;return c.action==='moveBed'?'Caminha nas mãos! Caminhe até um piso livre e toque em “Colocar caminha aqui”.':c.action==='placeBed'?'Caminha no novo lugar. Layla já pode descansar aqui.':c.action==='cancelBed'?'Caminha devolvida.':c.action==='pick'?'Você está carregando. Aproxime-se de um morador para oferecer ou usar.':c.action==='return'?'Guardado no lugar.':'Boa! A casa ganhou mais uma história.';
}
export const routinePoints:Record<ResidentId,Place[]>={
 dora:[areaById('living').arrival,areaById('kitchen').arrival,areaById('alfresco').arrival,areaById('court').arrival],
 teo:[areaById('garage').arrival,areaById('media').arrival,areaById('living').arrival,areaById('alfresco').arrival],
 biscoito:[BED,{...ITEMS.toy.position},areaById('garage').arrival,areaById('pool').arrival],
};
export const DOG_LINES=['Eu não estou dormindo. Estou economizando energia para o próximo petisco.','Téo perdeu o disco. Eu perdi a paciência. A Dora perdeu os dois.','Nesta casa eu sou a única que trabalha: recebo carinho em tempo integral.','Se cair comida no chão, a inspeção é por minha conta.'];
const lines:Record<ResidentId,string[]>={dora:['Hoje a festa começa assim que alguém achar o disco certo.','Estou cuidando das plantas. Téo cuida da conversa.','Um café, uma música e já temos um plano.'],teo:['Organizar discos por cor é um método científico. Meu.','Estou ensaiando um passinho que ainda não tem nome.','A Dora pediu ajuda. Vim conferir a acústica primeiro.'],biscoito:DOG_LINES};
/** Fixed-step caller; only its elected owner advances state. Never invokes a language model. */
export function tickLife(s:LifeState,dt:number,visitors:Visitor[],now=Date.now()){
 dt=Math.min(.25,Math.max(0,dt));
 tickSocial(s,visitors,now);
 if(s.bed.holder){const carrier=visitors.find(v=>v.id===s.bed.holder);if(carrier)s.bed.position={...carrier.position};}
 for(const item of s.items){if(item.holder){const holder=visitors.find(v=>v.id===item.holder)??s.residents.find(r=>r.id===item.holder);if(holder){item.position={...holder.position};item.height=item.holder==='biscoito'?.37:.9;}}}
 for(const r of s.residents){
  if(r.id==='biscoito'&&!['fetch','bring'].includes(r.activity)&&!(r.activity==='pet'&&now<r.until)){
   const toy=s.items.find(i=>i.id==='toy')!,holder=visitors.find(v=>v.id===toy.holder&&!v.frozen);
   if(holder){const d=distance(r.position,holder.position);if(r.activity!=='eager'||(!r.path.length&&d>1.2)||r.target!==holder.id){r.path=d>1.15?approach(r.position,holder.position):[];}r.activity='eager';r.target=holder.id;r.until=now+10000;r.angle=Math.atan2(holder.position.x-r.position.x,holder.position.z-r.position.z);if(!r.path.length)continue;}
   else if(r.activity==='eager'){r.activity='idle';r.path=[];r.target=undefined;r.until=now+4000;}
  }
  const next=r.path[0];
  if(next){const d=distance(r.position,next),step=Math.min(d,dt*residentSpeed(r.id));const p={x:r.position.x+(next.x-r.position.x)/(d||1)*step,z:r.position.z+(next.z-r.position.z)/(d||1)*step};
   const occupied=[...visitors,...s.residents.filter(other=>other.id!==r.id)].some(other=>distance(other.position,p)<(r.id==='biscoito'?.38:.5));
   if(!occupied){r.angle=Math.atan2(next.x-r.position.x,next.z-r.position.z);r.position=p;if(d<=step+.01)r.path.shift();}
   if(occupied&&r.id==='biscoito'&&(s.cooldown['dog-route']??0)<now){const goal=r.path[r.path.length-1];const reroute=houseRoute(r.position,goal,[...visitors,...s.residents.filter(a=>a.id!==r.id)].map(a=>a.position));if(reroute.length)r.path=reroute;s.cooldown['dog-route']=now+1200;}
   if(now>r.until){r.path=[];}continue;
  }
  if(r.activity==='fetch'){
   const toy=s.items.find(i=>i.id==='toy')!,v=visitors.find(v=>v.id===r.target);
   if(!v||v.frozen){if(toy.holder===r.id||toy.reserved===r.id)returnItem(toy);r.activity='idle';r.until=now+5000;continue;}
   if(toy.flight&&now<toy.flight.start+toy.flight.duration)continue;
   if(!toy.holder&&distance(r.position,toy.position)<.6){delete toy.flight;toy.holder='biscoito';r.activity='bring';r.path=approach(r.position,v.position);r.until=now+20000;}
   else{if(toy.reserved===r.id||toy.holder===r.id)returnItem(toy);r.activity='idle';r.until=now+5000;}continue;
  }
  if(r.activity==='bring'){
   const toy=s.items.find(i=>i.id==='toy')!,v=visitors.find(v=>v.id===r.target);
   if(v&&!v.frozen&&distance(r.position,v.position)<1.6&&!heldItem(s,v.id)){toy.holder=v.id;toy.reserved=undefined;remember(s,`Layla devolveu a bolinha a ${v.name.slice(0,24)}.`);speak(s,'biscoito','Trouxe de volta! Mais uma?',now);r.activity='idle';r.until=now+10000;}
   else if(v&&now<r.until){r.path=approach(r.position,v.position);}
   else{returnItem(toy);r.activity='idle';r.until=now+6000;}continue;
  }
  if(now<r.until&&r.activity!=='walk')continue;
  if(r.activity==='walk'){
   const item=s.items.find(i=>i.id===r.target&&i.reserved===r.id);
   if(item&&distance(r.position,item.position)<1.5){item.holder=r.id;item.height=.9;r.activity=item.id==='coffee'?'drink':item.id==='watering'?'water':'record';}
   else{if(item)returnItem(item);r.activity=r.id==='biscoito'&&distance(r.position,s.bed.position)<.45&&!s.bed.holder?'rest':r.id==='teo'?'dance':'idle';}
   r.until=now+residentPause(r.id,r.step);
   if(!s.speech||s.speech.until<now){const text=r.activity==='water'?'As plantas também merecem um pouco de atenção.':r.activity==='drink'?'Café pronto. Quem vem conversar?':r.activity==='record'?'Organizar discos por cor é um método científico. Meu.':lines[r.id][r.step%lines[r.id].length];speak(s,r.id,text,now);}continue;
  }
  if(['drink','water','record'].includes(r.activity)&&heldItem(s,r.id)){remember(s,`${NAMES[r.id]} ${r.activity==='drink'?'terminou seu café':r.activity==='water'?'cuidou da planta':'organizou os discos'}.`);}
  s.items.filter(i=>i.holder===r.id||i.reserved===r.id).forEach(returnItem);
  const phase=r.step++%4,desired=r.id==='dora'?(phase===0?'coffee':phase===1?'watering':undefined):r.id==='teo'&&phase===0?'record':undefined;
  const item=s.items.find(i=>i.id===desired&&!i.holder&&!i.reserved);r.target=item?.id;
  if(item){item.reserved=r.id;r.path=approach(r.position,item.position,visitors.map(v=>v.position));}
  else r.path=houseRoute(r.position,r.id==='biscoito'&&phase===0?(s.bed.holder?routinePoints.biscoito[1]:s.bed.position):routinePoints[r.id][phase],visitors.map(v=>v.position));
  r.activity='walk';r.until=now+45000;
  if(!r.path.length){if(item)returnItem(item);r.activity='idle';r.until=now+5000;}
 }
 for(const [id,until]of Object.entries(s.cooldown))if(id!=='dog-lines'&&until<now-60000)delete s.cooldown[id];
}
/** Persistence and network snapshots are untrusted; only known actors/items and finite coordinates are accepted. */
export function parseLife(raw:unknown):LifeState|null{
 try{const s=raw as LifeState,valid=(p:Place)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&!!roomAt(p);
 if(!s||s.version!==1||s.layoutVersion!==3||!Array.isArray(s.residents)||s.residents.length!==3||!Array.isArray(s.items)||s.items.length!==4)return null;
 if(new Set(s.residents.map(r=>r.id)).size!==3||s.residents.some(r=>!Object.prototype.hasOwnProperty.call(NAMES,r.id)||!valid(r.position)||!houseWalkable(r.position)||!['idle','walk','dance','water','record','rest','drink','greet','pet','fetch','bring','eager'].includes(r.activity)||!Number.isFinite(r.angle)||!Number.isFinite(r.until)||!Number.isInteger(r.step)||typeof r.activity!=='string'||r.activity.length>20||!Array.isArray(r.path)||r.path.length>400||r.path.some(p=>!valid(p)||!houseWalkable(p))))return null;
 if(new Set(s.items.map(i=>i.id)).size!==4||s.items.some(i=>!Object.prototype.hasOwnProperty.call(ITEMS,i.id)||i.kind!==i.id||(i.reserved!==undefined&&!Object.prototype.hasOwnProperty.call(NAMES,i.reserved))||!valid(i.position)||!Number.isFinite(i.height)||i.height<0||i.height>2||(i.holder!==undefined&&(typeof i.holder!=='string'||i.holder.length>100))))return null;
 if(new Set(s.items.filter(i=>i.holder).map(i=>i.holder)).size!==s.items.filter(i=>i.holder).length)return null;
 if(!Array.isArray(s.memories)||s.memories.length>12||s.memories.some(m=>typeof m!=='string'||m.length>200))return null;
 if(s.speech&&(!Object.prototype.hasOwnProperty.call(NAMES,s.speech.owner)||typeof s.speech.text!=='string'||s.speech.text.length>250||!Number.isFinite(s.speech.until)))return null;
 if(!s.cooldown||typeof s.cooldown!=='object'||Object.keys(s.cooldown).length>600||Object.values(s.cooldown).some(t=>!Number.isFinite(t)))return null;
 if([s.watered,s.coffees,s.dances,s.fetches].some(n=>!Number.isInteger(n)||n<0))return null;
 if(s.bed&&(!valid(s.bed.position)||!valid(s.bed.home)||!bedFits(s.bed.home)||(s.bed.holder!==undefined&&(typeof s.bed.holder!=='string'||s.bed.holder.length>100))))return null;
 if(s.social&&!validSocial(s.social))return null;
 for(const item of s.items)if(item.flight){const f=item.flight;if(item.id!=='toy'||!valid(f.from)||!valid(f.to)||![f.start,f.duration,f.fromHeight,f.toHeight].every(Number.isFinite)||f.duration<200||f.duration>5000||f.fromHeight<0||f.fromHeight>2||f.toHeight<0||f.toHeight>2)return null;}
 const result=structuredClone(s);result.social??=freshSocial();result.bed??={position:{...BED},home:{...BED}};return result;
 }catch{return null;}
}
