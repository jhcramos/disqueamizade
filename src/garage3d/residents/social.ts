import {CONCIERGE_ACTIONS,companyCommand,tickCompany,validConcierge,concierge,type Concierge} from './concierge.ts';
import {houseRoute,houseWalkable,roomAt,type Place} from '../layout.ts';
import type {Command,LifeState,Visitor} from './model.ts';
export type HostInvite={id:string;host:'dora'|'teo';kind:'welcome'|'meet'|'activity'|'ball';from:string;to:string;fromName:string;toName:string;stage:'pending'|'ready';expires:number;point?:Place;topic:string};
export type HostSocial={concierge?:Concierge;solo:Record<string,boolean>;invites:HostInvite[];welcomed:Record<string,number>};
export const HOST_ACTIONS=new Set([...CONCIERGE_ACTIONS,'introduce','together','solo','socialOn','passToy','acceptHost','declineHost','dismissHost']);
export const freshSocial=():HostSocial=>({solo:{},invites:[],welcomed:{}});
const dist=(a:Place,b:Place)=>Math.hypot(a.x-b.x,a.z-b.z);
const available=(s:LifeState,v:Visitor)=>!v.frozen&&v.available!==false&&!s.social.solo[v.id];
const compatible=(a:Visitor,b:Visitor)=>a.id!==b.id&&(a.publicId??a.id)!==(b.publicId??b.id)&&roomAt(a.position)===roomAt(b.position)&&!a.blocked?.includes(b.publicId??b.id)&&!b.blocked?.includes(a.publicId??a.id);
const involved=(s:LifeState,id:string)=>concierge(s).circles.some(r=>r.members.some(m=>m.id===id))||concierge(s).proposals.some(p=>p.from===id||p.to===id)||s.social.invites.some(i=>i.kind!=='welcome'&&(i.from===id||i.to===id));
function begin(s:LifeState,c:Command,visitors:Visitor[],now:number,kind:'meet'|'activity'|'ball'){
 const a=c.visitor;if(!available(s,a))return 'Ative as apresentações quando quiser companhia.';
 if(involved(s,a.id))return 'Você já tem um convite. Conclua ou cancele antes de começar outro.';
 if((s.cooldown[`host:${a.id}`]??0)>now)return 'Vamos dar um tempinho antes de outro convite.';
 if(kind==='ball'&&!s.items.some(i=>i.id==='toy'&&i.holder===a.id))return 'Pegue a bolinha antes de passar a vez.';
 const b=visitors.filter(v=>available(s,v)&&(s.cooldown[`host:${v.id}`]??0)<=now&&compatible(a,v)&&!involved(s,v.id)&&dist(a.position,v.position)<7&&(kind!=='ball'||(!s.items.some(i=>i.holder===v.id)&&s.bed.holder!==v.id))).sort((x,y)=>dist(a.position,x.position)-dist(a.position,y.position))[0];
 if(!b)return 'Ainda não há alguém disponível por perto. Pode brincar com Layla enquanto espera.';
 const host=c.target==='teo'?'teo':'dora';
 s.social.invites=s.social.invites.filter(i=>i.kind!=='welcome'||![a.id,b.id].includes(i.to));
 s.social.invites.push({id:c.id,host,kind,from:a.id,to:b.id,fromName:a.name,toName:b.name,stage:'pending',expires:now+30000,topic:kind==='activity'?(host==='teo'?'Qual música vocês escolheriam para uma festa de garagem?':'Qual história vocês contariam tomando um café?'):'Qual foi a amizade mais inesperada que você já fez?'});
 s.cooldown[`host:${a.id}`]=now+45000;s.cooldown[`host:${b.id}`]=now+45000;
 return kind==='ball'?'Convite enviado. A bolinha continua com você até a outra pessoa aceitar.':'Convite enviado. A outra pessoa escolhe se quer participar.';
}
export function hostCommand(s:LifeState,c:Command,visitors:Visitor[],now:number):string{
 const v=c.visitor;s.social??=freshSocial();
 if(CONCIERGE_ACTIONS.has(c.action))return companyCommand(s,c,visitors,now);
 if(c.action==='solo'||c.action==='socialOn'){
  s.social.solo[v.id]=c.action==='solo';s.social.welcomed[v.id]=now;
  if(c.action==='solo'){s.social.invites=s.social.invites.filter(i=>i.from!==v.id&&i.to!==v.id);companyCommand(s,{...c,action:'cancelCompany'},visitors,now);}
  return c.action==='solo'?'Tudo bem! Dora e Téo vão deixar você explorar em paz.':'Dora e Téo podem voltar a convidar você.';
 }
 if(c.action==='introduce'||c.action==='together'||c.action==='passToy')return begin(s,c,visitors,now,c.action==='passToy'?'ball':c.action==='together'?'activity':'meet');
 const invite=s.social.invites.find(i=>i.id===c.target&&(i.from===v.id||i.to===v.id));
 if(!invite||invite.expires<=now)return 'Esse convite já terminou.';
 if(c.action==='declineHost'||c.action==='dismissHost'){
  s.social.invites=s.social.invites.filter(i=>i!==invite);s.cooldown[`host:${v.id}`]=now+60000;
  return 'Tudo bem. Você decide quando quer companhia.';
 }
 if(c.action!=='acceptHost'||invite.to!==v.id||invite.stage!=='pending')return 'Esse convite não está disponível.';
 if(invite.kind==='welcome'){
  s.social.invites=s.social.invites.filter(i=>i!==invite);
  return begin(s,{...c,target:invite.host},visitors,now,'meet');
 }
 const from=visitors.find(a=>a.id===invite.from);
 if(!from||!available(s,from)||!available(s,v)||!compatible(from,v)||dist(from.position,v.position)>8){s.social.invites=s.social.invites.filter(i=>i!==invite);return 'A outra pessoa não está disponível agora.';}
 if(invite.kind==='ball'){
  const ball=s.items.find(i=>i.id==='toy');
  if(!ball||ball.holder!==from.id||s.items.some(i=>i.holder===v.id)||s.bed.holder===v.id){s.social.invites=s.social.invites.filter(i=>i!==invite);return 'A bolinha não está disponível para passar agora.';}
  ball.flight={from:{...from.position},to:{...v.position},start:now,duration:1800,fromHeight:.9,toHeight:.9};ball.holder=v.id;ball.position={...v.position};ball.height=.9;
  s.social.invites=s.social.invites.filter(i=>i!==invite);
  s.speech={owner:'biscoito',text:'Oba, gente nova no meu time de arremessadores!',until:now+6500};
  return 'Sua vez! Layla está esperando você jogar a bolinha.';
 }
 const sharedObject=invite.kind==='activity'?s.items.find(i=>['coffee','record'].includes(i.id)&&!i.holder&&roomAt(i.position)===roomAt(from.position)):undefined;
 const anchor=sharedObject?.position??from.position;
 const point=Array.from({length:12},(_,n)=>({x:anchor.x+Math.sin(n*Math.PI/6)*1.15,z:anchor.z+Math.cos(n*Math.PI/6)*1.15})).find(p=>houseWalkable(p)&&houseRoute(v.position,p).length&&visitors.every(a=>a.id===v.id||dist(a.position,p)>.6));
 if(!point){s.social.invites=s.social.invites.filter(i=>i!==invite);return 'Está apertado aqui. Tentem um lugar mais livre.';}
 if(sharedObject)invite.topic=sharedObject.id==='record'?'Encontrem-se perto dos discos. Que música vocês escolheriam juntos?':'Encontrem-se perto do café. Qual história vocês contariam numa primeira conversa?';
 invite.stage='ready';invite.point=point;invite.expires=now+60000;
 const host=s.residents.find(r=>r.id===invite.host)!;host.path=houseRoute(host.position,{...from.position,x:from.position.x+.8});host.activity='greet';host.until=now+12000;
 s.speech={owner:invite.host,text:`${invite.fromName} e ${invite.toName}, que bom! ${invite.topic}`.slice(0,220),until:now+9000};
 return 'Apresentação aceita! Toque em “Ir ao encontro” para chegar perto. Câmera e microfone continuam desligados.';
}
export function tickSocial(s:LifeState,visitors:Visitor[],now:number){
 s.social??=freshSocial();tickCompany(s,visitors,now);const byId=new Map(visitors.map(v=>[v.id,v]));
 s.social.invites=s.social.invites.filter(i=>{const a=byId.get(i.from),b=byId.get(i.to);return i.expires>now&&a&&b&&available(s,a)&&available(s,b)&&(i.kind==='welcome'||compatible(a,b));});
 for(const id of Object.keys(s.social.welcomed))if(!byId.has(id)&&now-s.social.welcomed[id]>120000){delete s.social.welcomed[id];delete s.social.solo[id];}
 for(const v of visitors){if(concierge(s).requests[v.id]||!available(s,v)||s.social.welcomed[v.id]||s.social.invites.length>=20||involved(s,v.id))continue;
  s.social.welcomed[v.id]=now||1;
  s.social.invites.push({id:`welcome:${v.id}`,host:'dora',kind:'welcome',from:v.id,to:v.id,fromName:v.name,toName:v.name,stage:'pending',expires:now+45000,topic:'Quer ajuda para conhecer o pessoal da casa?'});
 }
}
export function validSocial(value:unknown):value is HostSocial{
 const s=value as HostSocial;if(s?.concierge&&!validConcierge(s.concierge))return false;if(!s||!s.solo||!s.welcomed||!Array.isArray(s.invites)||s.invites.length>24||Object.keys(s.solo).length>120||Object.keys(s.welcomed).length>120)return false;
 if(Object.values(s.solo).some(v=>typeof v!=='boolean')||Object.values(s.welcomed).some(v=>!Number.isFinite(v)))return false;
 const str=(x:unknown,n:number)=>typeof x==='string'&&x.length>0&&x.length<=n;
 return new Set(s.invites.map(i=>i.id)).size===s.invites.length&&s.invites.every(i=>str(i.id,100)&&str(i.from,100)&&str(i.to,100)&&str(i.fromName,24)&&str(i.toName,24)&&['dora','teo'].includes(i.host)&&['welcome','meet','activity','ball'].includes(i.kind)&&['pending','ready'].includes(i.stage)&&Number.isFinite(i.expires)&&str(i.topic,200)&&(!i.point||(Number.isFinite(i.point.x)&&Number.isFinite(i.point.z)&&houseWalkable(i.point))));
}
/** Invitations are personal; public speech is only emitted after acceptance. */
export function personalLife(s:LifeState,id:string):LifeState{const state=structuredClone(s);state.social??=freshSocial();state.social.invites=state.social.invites.filter(i=>i.from===id||i.to===id);state.social.solo={[id]:!!state.social.solo[id]};state.social.welcomed={};const c=concierge(state);
 c.reservedSeats=c.circles.flatMap(r=>r.members.filter(m=>m.id!==id).map(m=>m.seat));
 c.requests=c.requests[id]?{[id]:c.requests[id]}:{};
 c.proposals=c.proposals.filter(p=>p.from===id||(p.to===id&&p.stage==='invited'));
 c.circles=c.circles.filter(r=>r.members.some(m=>m.id===id));return state;}
