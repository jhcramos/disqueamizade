import {approachSeat,houseRoute,roomAt,seatsFor,worldPoint,type RoomId} from '../layout.ts';
import {seatsForRoom} from '../../garage/seats.ts';
import type {Command,LifeState,Visitor} from './model.ts';

export const ACTIVITIES={music:'Escolher a trilha da casa',coffee:'Café e papo tranquilo',stories:'Trocar histórias',play:'Brincar com Layla'} as const;
export const TOPICS={song:'Qual música merece entrar na trilha da casa?',small:'Que pequena coisa deixou seu dia melhor?',discovery:'O que você descobriu por acaso e adorou?',pet:'Qual foi a maior travessura de um bichinho que você conheceu?'} as const;
export const COMPANY_CHOICES=[{text:'Papo tranquilo',symbol:'💬',activity:'coffee'},{text:'Ouvir música juntos',symbol:'🎵',activity:'music'},{text:'Jogar ou brincar',symbol:'🎲',activity:'play'},{text:'Topo qualquer coisa',symbol:'✨',activity:'any'}] as const;
export const quickPreference=(text:string)=>COMPANY_CHOICES.find(c=>c.text===text)?.activity;
export const ROOM_LABELS={garage:'Garagem',living:'Sala de estar',bar:'Jogos e café · 18+'};
export type Activity=keyof typeof ACTIVITIES;
export type Topic=keyof typeof TOPICS;
export type CompanyRequest={id:string;text:string;host:'dora'|'teo';expires:number;pending?:boolean;notice?:string};
export type CircleMember={id:string;name:string;seat:string;arriveBy?:number;arrived?:boolean};
export type SocialCircle={id:string;spot:string;room:RoomId;activity:Activity;topic:Topic;members:CircleMember[];expires:number};
export type Proposal={id:string;from:string;to:string;fromName:string;toName:string;host:'dora'|'teo';spot:string;circle?:string;activity:Activity;topic:Topic;stage:'review'|'invited';expires:number;source:'jev'|'prepared';line?:string};
export type Concierge={reservedSeats?:string[];requests:Record<string,CompanyRequest>;proposals:Proposal[];circles:SocialCircle[]};
export type Candidate={id:string;to:string;spot:string;circle?:string;description:string;request:string;activity?:Activity};
export type Decision={option:string;activity:Activity;topic:Topic;source:'jev'|'prepared';line?:string};
export const CONCIERGE_ACTIONS=new Set(['askCompany','cancelCompany','acceptCompany','declineCompany','leaveCompany']);
export const freshConcierge=():Concierge=>({requests:{},proposals:[],circles:[]});
export const concierge=(s:LifeState)=>s.social.concierge??(s.social.concierge=freshConcierge());
export const SPOTS=[
 {id:'garage-music',room:'garage',name:'Sofá do som',activity:'music'},
 {id:'garage-chairs',room:'garage',name:'Banco e poltronas',activity:'stories'},
 {id:'living-sofa',room:'living',name:'Sofá da sala',activity:'coffee'},
 {id:'living-coffee',room:'living',name:'Cantinho do café',activity:'stories'},
 {id:'bar-table-1',room:'bar',name:'Mesa perto dos discos',activity:'music'},
] as const;
export function spotSeats(spot:string){const def=SPOTS.find(s=>s.id===spot);if(!def)return[];return seatsForRoom(def.room).filter(s=>def.room==='bar'?s.id.startsWith(`table-${spot.endsWith('1')?'1':'3'}-`):s.id.startsWith(spot+'-'));}
export function seatDestination(spot:string,seat:string){const def=SPOTS.find(s=>s.id===spot),s=spotSeats(spot).find(s=>s.id===seat);if(!def||!s)return;return worldPoint(approachSeat(seatsFor(def.room)[s.worldIndex]),def.room);}
const available=(s:LifeState,v:Visitor)=>v.available!==false&&!v.frozen&&!s.social.solo[v.id];
const compatible=(a:Visitor,b:Visitor)=>a.id!==b.id&&(a.publicId??a.id)!==(b.publicId??b.id)&&(!(roomAt(a.position)==='bar'||roomAt(b.position)==='bar')||(a.adult===true&&b.adult===true))&&!a.blocked?.includes(b.publicId??b.id)&&!b.blocked?.includes(a.publicId??a.id);
const requested=(s:LifeState,v:Visitor,now:number)=>available(s,v)&&(concierge(s).requests[v.id]?.expires??0)>now;
function busy(s:LifeState,id:string){return concierge(s).proposals.some(p=>p.from===id||p.to===id)||s.social.invites.some(i=>i.kind!=='welcome'&&(i.from===id||i.to===id));}
function freeSeats(s:LifeState,spot:string,visitors:Visitor[],ignore:string[]=[]){
 const occupied=new Set(visitors.filter(v=>!ignore.includes(v.id)).map(v=>v.seat).filter(Boolean));
 for(const c of concierge(s).circles)for(const m of c.members)if(!ignore.includes(m.id))occupied.add(m.seat);
 return spotSeats(spot).filter(seat=>!occupied.has(seat.id));
}
/** Candidate construction is code-owned. Text is only opt-in, temporary host requests. */
export function companyCandidates(s:LifeState,a:Visitor,visitors:Visitor[],now:number):Candidate[]{
 const c=concierge(s);if(!requested(s,a,now)||(s.cooldown[`company-refused:${a.id}`]??0)>now||busy(s,a.id)||c.circles.some(r=>r.members.some(m=>m.id===a.id)))return[];
 const choices:Candidate[]=[];
 for(const circle of c.circles){
  const b=visitors.find(v=>v.id===circle.members[0]?.id);
  if(!b||!requested(s,b,now)||busy(s,b.id)||!compatible(a,b)||(circle.room==='bar'&&(!a.adult||!b.adult))||circle.members.length>=4||circle.members.some(m=>{const v=visitors.find(v=>v.id===m.id);return !v||!available(s,v)||!compatible(a,v);})||!freeSeats(s,circle.spot,visitors,[a.id]).length)continue;
  choices.push({id:`circle:${circle.id}`,to:b.id,spot:circle.spot,circle:circle.id,description:`Roda com ${circle.members.length}/4 pessoas em ${SPOTS.find(p=>p.id===circle.spot)?.name}: ${ACTIVITIES[circle.activity]}`,request:c.requests[b.id].text,activity:circle.activity});
 }
 for(const b of visitors){
  if(!requested(s,b,now)||!compatible(a,b)||busy(s,b.id)||c.circles.some(r=>r.members.some(m=>m.id===b.id))||(s.cooldown[`company-refused:${b.id}`]??0)>now)continue;
  for(const spot of SPOTS.filter(p=>p.room!=='bar'||(a.adult&&b.adult)).sort((x,y)=>Number(y.room===roomAt(a.position))-Number(x.room===roomAt(a.position)))){
   if(c.circles.some(r=>r.spot===spot.id)||freeSeats(s,spot.id,visitors,[a.id,b.id]).length<2)continue;
   choices.push({id:`new:${b.id}:${spot.id}`,to:b.id,spot:spot.id,description:`Nova roda: ${spot.name} em ${ROOM_LABELS[spot.room]}; ${ACTIVITIES[spot.activity]}; dois lugares livres`,request:c.requests[b.id].text});
  }
 }
 const wanted=quickPreference(c.requests[a.id].text)??explicitActivity(c.requests[a.id].text);
 const rank=(c:Candidate)=>{const other=c.activity??quickPreference(c.request)??explicitActivity(c.request);return (fits(wanted,other)?0:10)+(c.circle?0:1);};
 return choices.sort((a,b)=>rank(a)-rank(b)).slice(0,12);
}
function explicitActivity(text:string):Activity|undefined{const t=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(/\b(nao|sozinh|quieto|silencio|ninguem)/.test(t))return;if(/music|rock|samba|canc|danc|trilha/.test(t))return'music';if(/cafe|tranquilo|calmo|relax/.test(t))return'coffee';if(/layla|biscoito|bola|cachorr|brinc/.test(t))return'play';if(/historia|conhecer|convers|amizade|papo/.test(t))return'stories';}
const fits=(a:Activity|'any'|undefined,b:Activity|'any'|undefined)=>!!a&&!!b&&(a==='any'||b==='any'||a===b||(['coffee','stories'].includes(a)&&['coffee','stories'].includes(b)));
export function preparedDecision(request:string,candidates:Candidate[]):Decision{
 const wanted=quickPreference(request)??explicitActivity(request);
 const relevant=candidates.filter(c=>fits(wanted,c.activity??quickPreference(c.request)??explicitActivity(c.request)));
 const selected=relevant.find(c=>c.circle)||relevant.find(c=>SPOTS.find(p=>p.id===c.spot)?.activity===wanted)||relevant[0];
 const other=selected&&(quickPreference(selected.request)??explicitActivity(selected.request));
 const activity:Activity=selected?.activity??(wanted&&wanted!=='any'?wanted:other&&other!=='any'?other:'stories');
 return{option:selected?.id??'none',activity,topic:activity==='music'?'song':activity==='coffee'?'small':activity==='play'?'pet':'discovery',source:'prepared'};
}
export function applyCompanyDecision(s:LifeState,id:string,requestId:string,decision:Decision,visitors:Visitor[],now:number){
 const c=concierge(s),request=c.requests[id],a=visitors.find(v=>v.id===id);if(!request||request.id!==requestId||!request.pending)return;
 request.pending=false;const option=a&&companyCandidates(s,a,visitors,now).find(o=>o.id===decision.option);
 if(!a||!option){request.notice=waitingNotice(s,a,visitors,now);return;}
 const b=visitors.find(v=>v.id===option.to)!;
 const circle=c.circles.find(r=>r.id===option.circle);
 c.proposals.push({id:requestId,from:id,to:b.id,fromName:a.name,toName:b.name,host:request.host,spot:option.spot,circle:option.circle,activity:circle?.activity??decision.activity,topic:circle?.topic??decision.topic,stage:'review',expires:now+60000,source:decision.source,line:decision.line});
 s.social.invites=s.social.invites.filter(i=>i.kind!=='welcome'||i.to!==id);
 request.notice='Encontrei uma possibilidade. Veja se combina com você.';
}
export function companyCommand(s:LifeState,cmd:Command,visitors:Visitor[],now:number):string{
 const c=concierge(s),v=cmd.visitor;
 if(cmd.action==='askCompany'){
  if(!available(s,v))return 'Ative as apresentações quando quiser companhia.';
  if(busy(s,v.id)||c.circles.some(r=>r.members.some(m=>m.id===v.id)))return 'Conclua seu encontro ou convite antes de pedir outra sugestão.';
  if((s.cooldown[`company:${v.id}`]??0)>now)return 'Aguarde um instante antes de pedir outra sugestão.';
  const text=typeof cmd.request==='string'?cmd.request.trim().slice(0,240):'';if(text.length<3)return 'Conte em poucas palavras o que você gostaria de fazer.';
  c.requests[v.id]={id:cmd.id,text,host:cmd.target==='teo'?'teo':'dora',expires:now+600000,pending:true};s.cooldown[`company:${v.id}`]=now+(quickPreference(text)?5000:60000);s.cooldown[`company-check:${v.id}`]=now+5000;
  s.social.invites=s.social.invites.filter(i=>i.kind!=='welcome'||i.to!==v.id);
  return 'Vou procurar uma roda e uma atividade para você.';
 }
 if(cmd.action==='cancelCompany'||cmd.action==='leaveCompany'){
  delete c.requests[v.id];c.proposals=c.proposals.filter(p=>p.from!==v.id&&p.to!==v.id);
  c.circles.forEach(r=>{r.members=r.members.filter(m=>m.id!==v.id);});c.circles=c.circles.filter(r=>r.members.length);
  return 'Pedido encerrado. Você pode explorar no seu ritmo.';
 }
 const p=c.proposals.find(p=>p.id===cmd.target&&(p.from===v.id||p.to===v.id));if(!p||p.expires<=now)return 'Essa sugestão já terminou.';
 if(cmd.action==='declineCompany'){
  c.proposals=c.proposals.filter(r=>r!==p);s.cooldown[`company-refused:${v.id}`]=now+120000;
  delete c.requests[v.id];if(c.requests[p.from])c.requests[p.from].notice='Esse encontro não aconteceu. Você pode pedir outra sugestão quando quiser.';
  return 'Tudo bem. Não vamos insistir nessa sugestão.';
 }
 if(cmd.action!=='acceptCompany')return 'Escolha uma sugestão disponível.';
 // Review is private to its requester; invitation is only accepted by its recipient.
 if((p.stage==='review'&&p.from!==v.id)||(p.stage==='invited'&&p.to!==v.id))return 'Aguarde a resposta da outra pessoa.';
 const a=visitors.find(v=>v.id===p.from),b=visitors.find(v=>v.id===p.to);
 if(!a||!b||(SPOTS.find(s=>s.id===p.spot)?.room==='bar'&&(!a.adult||!b.adult))||!requested(s,a,now)||!requested(s,b,now)||!compatible(a,b)){c.proposals=c.proposals.filter(r=>r!==p);return 'A disponibilidade mudou. Peça outra sugestão.';}
 if(p.stage==='review'){p.stage='invited';p.expires=now+45000;s.social.invites=s.social.invites.filter(i=>i.kind!=='welcome'||i.to!==p.to);return 'Convite enviado. Vamos esperar o aceite.';}
 let circle=c.circles.find(r=>r.id===p.circle);
 if(p.circle&&(!circle||circle.members[0]?.id!==b.id||circle.members.length>=4||circle.members.some(m=>{const member=visitors.find(v=>v.id===m.id);return !member||!available(s,member)||!compatible(a,member);}))){c.proposals=c.proposals.filter(r=>r!==p);return 'Essa roda não está disponível agora.';}
 if(!p.circle&&c.circles.some(r=>r.spot===p.spot||r.members.some(m=>m.id===a.id||m.id===b.id))){c.proposals=c.proposals.filter(r=>r!==p);return 'Esse lugar já foi escolhido. Vamos procurar outro.';}
 const members=circle?[a]:[a,b],seats=freeSeats(s,p.spot,visitors,members.map(v=>v.id));
 if(seats.length<members.length||members.some((m,i)=>!houseRoute(m.position,seatDestination(p.spot,seats[i].id)!).length)){c.proposals=c.proposals.filter(r=>r!==p);return 'Os lugares ficaram ocupados. Peça uma nova sugestão.';}
 if(!circle){circle={id:p.id,spot:p.spot,room:SPOTS.find(s=>s.id===p.spot)!.room,activity:p.activity,topic:p.topic,members:[],expires:now+120000};c.circles.push(circle);}
 members.forEach((m,i)=>circle!.members.push({id:m.id,name:m.name,seat:seats[i].id,arriveBy:now+120000}));circle.expires=now+120000;
 c.proposals=c.proposals.filter(r=>r!==p);
 s.speech={owner:p.host,text:`${a.name} e ${b.name}, encontro combinado! ${TOPICS[circle.topic]}`.slice(0,220),until:now+9000};
 return 'Vocês aceitaram! Os lugares estão reservados. Toque em “Ir para a roda”.';
}
function waitingNotice(s:LifeState,a:Visitor|undefined,visitors:Visitor[],now:number){
 const others=a&&visitors.some(v=>compatible(a,v)&&requested(s,v,now)&&!busy(s,v.id));
 return others?'Ainda não apareceu uma combinação. Pode passear; aviso quando encontrar.':'Ainda não há outros visitantes disponíveis para este encontro. Pode brincar com Layla enquanto espera.';
}
export function tickCompany(s:LifeState,visitors:Visitor[],now:number){
 const c=concierge(s),byId=new Map(visitors.map(v=>[v.id,v]));
 for(const[id,r]of Object.entries(c.requests))if(r.expires<=now||s.social.solo[id])delete c.requests[id];
 c.proposals=c.proposals.filter(p=>{const a=byId.get(p.from),b=byId.get(p.to);return p.expires>now&&a&&b&&requested(s,a,now)&&requested(s,b,now)&&compatible(a,b);});
 c.circles.forEach(r=>{r.members=r.members.filter(m=>{const v=byId.get(m.id);if(v?.seat===m.seat)m.arrived=true;return v&&((v.seat===m.seat)||(!m.arrived&&(m.arriveBy??r.expires)>now))&&v.available!==false&&!s.social.solo[m.id]&&(r.room!=='bar'||v.adult===true)&&(roomAt(v.position)===r.room||!m.arrived)&&!r.members.some(other=>{const person=byId.get(other.id);return person&&person.id!==v.id&&!compatible(v,person);});});if(r.members.some(m=>byId.get(m.id)?.seat===m.seat))r.expires=now+120000;});
 c.circles=c.circles.filter(r=>r.members.length&&r.expires>now);
 // Recheck waiting opt-in visitors with code only; polling never triggers a model call.
 for(const v of visitors){const r=c.requests[v.id];if(!r||r.pending||!requested(s,v,now)||busy(s,v.id)||c.circles.some(c=>c.members.some(m=>m.id===v.id))||(s.cooldown[`company-check:${v.id}`]??0)>now)continue;
  s.cooldown[`company-check:${v.id}`]=now+5000;const candidates=companyCandidates(s,v,visitors,now),decision=preparedDecision(r.text,candidates);
  if(decision.option!=='none'){r.pending=true;applyCompanyDecision(s,v.id,r.id,decision,visitors,now);}else r.notice=waitingNotice(s,v,visitors,now);
 }

}
export function validConcierge(value:unknown):value is Concierge{
 const c=value as Concierge;
 if(!c||!c.requests||Array.isArray(c.requests)||typeof c.requests!=='object'||!Array.isArray(c.proposals)||!Array.isArray(c.circles)||Object.keys(c.requests).length>120||c.proposals.length>60||c.circles.length>6)return false;
 const str=(v:unknown,n=100)=>typeof v==='string'&&v.length>0&&v.length<=n;
 const activity=(v:unknown)=>typeof v==='string'&&Object.prototype.hasOwnProperty.call(ACTIVITIES,v);
 const topic=(v:unknown)=>typeof v==='string'&&Object.prototype.hasOwnProperty.call(TOPICS,v);
 if(c.reservedSeats&&(!Array.isArray(c.reservedSeats)||c.reservedSeats.length>24||c.reservedSeats.some(id=>!SPOTS.some(s=>spotSeats(s.id).some(seat=>seat.id===id)))))return false;
 if(!Object.values(c.requests).every(r=>r&&str(r.id)&&str(r.text,240)&&['dora','teo'].includes(r.host)&&Number.isFinite(r.expires)&&(!r.notice||str(r.notice,240))&&(r.pending===undefined||typeof r.pending==='boolean')))return false;
 if(!c.proposals.every(p=>p&&str(p.id)&&str(p.from)&&str(p.to)&&p.from!==p.to&&str(p.fromName,24)&&str(p.toName,24)&&SPOTS.some(s=>s.id===p.spot)&&['dora','teo'].includes(p.host)&&['jev','prepared'].includes(p.source)&&activity(p.activity)&&topic(p.topic)&&['review','invited'].includes(p.stage)&&Number.isFinite(p.expires)&&(!p.line||str(p.line,180))))return false;
 if(!c.circles.every(r=>r&&str(r.id)&&SPOTS.some(s=>s.id===r.spot&&s.room===r.room)&&activity(r.activity)&&topic(r.topic)&&Number.isFinite(r.expires)&&Array.isArray(r.members)&&r.members.length>0&&r.members.length<=4&&r.members.every(m=>m&&str(m.id)&&str(m.name,24)&&(m.arriveBy===undefined||Number.isFinite(m.arriveBy))&&(m.arrived===undefined||typeof m.arrived==='boolean')&&spotSeats(r.spot).some(s=>s.id===m.seat))))return false;
 const members=c.circles.flatMap(r=>r.members);
 return new Set(c.circles.map(r=>r.spot)).size===c.circles.length&&new Set(c.proposals.map(p=>p.id)).size===c.proposals.length&&new Set(members.map(m=>m.id)).size===members.length&&new Set(members.map(m=>m.seat)).size===members.length;
}
