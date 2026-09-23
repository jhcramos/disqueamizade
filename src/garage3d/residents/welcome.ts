import {areaAt} from '../areas.ts';
import type {LifeState,Visitor} from './model.ts';
const TOPICS:Record<string,string>={musica:'música',rock:'música',mpb:'música',jazz:'música',samba:'música',music:'música',jogos:'jogos',games:'jogos',poker:'jogos',cinema:'cinema',filmes:'cinema',viagens:'viagens',viajar:'viagens',leitura:'livros',livros:'livros',culinaria:'culinária',cozinhar:'culinária',cafe:'café',pets:'animais',animais:'animais',cachorros:'animais',arte:'arte',tecnologia:'tecnologia'};
/** Exact voluntary hobby tags only. Biography, identity and orientation are not inputs. */
export function publicInterestTags(raw:unknown):string[]{
 if(!Array.isArray(raw))return [];
 return [...new Set(raw.slice(0,5).flatMap(t=>{if(typeof t!=='string'||t.length>40)return [];const k=t.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');return TOPICS[k]?[TOPICS[k]]:[];}))];
}
export type Arrival={area:string;seen:number;greeted:boolean;next:number};
export function validArrivals(raw:unknown):raw is Record<string,Arrival>{
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length>100)return false;
 return Object.entries(raw).every(([id,a])=>id.length<=100&&a&&typeof a.area==='string'&&a.area.length<=30&&typeof a.greeted==='boolean'&&Number.isFinite(a.seen)&&Number.isFinite(a.next));
}
export function welcomeLine(v:Visitor,cycle:number){
 const name=v.name.replace(/[<>\r\n]/g,'').trim().slice(0,24)||'visitante';
 const topic=publicInterestTags(v.publicInterests)[0];
 if(topic==='música')return `${name}, vi música nos seus interesses! A casa ganhou repertório. Só não dê corda ao solo da louça do Harold.`;
 if(topic==='jogos')return `${name}, você marcou jogos no perfil! A mesa ganhou uma boa companhia. Aqui até perder rende história.`;
 if(topic==='animais')return `${name}, você curte animais! Layla aprova sua chegada. O pagamento dela é carinho, quando você quiser.`;
 if(topic)return `${name}, que bom ter alguém que curte ${topic} por aqui! Sua próxima boa conversa pode começar com esse assunto.`;
 return cycle%2?`${name}, chega mais! A casa ficou mais interessante com você. A louça não faz parte do convite, prometo.`:`Que bom que você chegou, ${name}! Fique à vontade. Nesta casa todo mundo tem uma história para somar.`;
}
/** Observe arrivals, then greet once nearby, without interrupting a spoken line or private activity. */
export function tickWelcome(s:LifeState,visitors:Visitor[],now:number){
 s.arrivals??={};const present=new Set(visitors.map(v=>v.id));
 for(const [id,a] of Object.entries(s.arrivals))if(!present.has(id)&&now-a.seen>90000)delete s.arrivals[id];
 for(const v of visitors){
  if(v.available===false)continue;
  const area=areaAt(v.position)?.id??'outside';let a=s.arrivals[v.id];
  if(!a&&Object.keys(s.arrivals).length>=100)continue;
  if(!a||a.area!==area)s.arrivals[v.id]=a={area,seen:now,greeted:false,next:a?.next??0};else a.seen=now;
  if(a.greeted||a.next>now||v.frozen||v.seat||s.social.solo[v.id]||(s.cooldown['welcome-global']??0)>now||s.speech&&s.speech.until>now)continue;
  const host=s.residents.find(r=>r.id!=='biscoito'&&!r.path.length&&areaAt(r.position)?.id===area&&Math.hypot(r.position.x-v.position.x,r.position.z-v.position.z)<3);
  if(!host)continue;
  a.greeted=true;a.next=now+300000;s.cooldown['welcome-global']=now+30000;
  s.speech={owner:host.id,text:welcomeLine(v,s.domestic?.cycle??0),until:now+8500,kind:'speech'};
  if(!s.domestic||s.domestic.phase==='idle'){host.angle=Math.atan2(v.position.x-host.position.x,v.position.z-host.position.z);host.activity='greet';host.until=now+8500;}
  break;
 }
}
