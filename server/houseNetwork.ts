import {parsePerson, type RoomId} from '../src/garage/model.ts';
import {changeScreening,emptyScreening,type Screening} from '../src/garage/theatre/model.ts';
export type Packet={id:string;channel:string;data:Record<string,any>;seq:number;at:number;from:string;to?:string};
type Member={owner:string;seen:number;person:Record<string,any>};
export type NetworkState={seq:number;members:Record<string,Member>;packets:Packet[];departed?:Record<string,number>;screenings?:Partial<Record<RoomId,Screening>>};
export const emptyNetwork=():NetworkState=>({seq:0,members:{},packets:[]});
function releaseAbsentDJs(s:NetworkState){
 for(const [room,state]of Object.entries(s.screenings??{}))if(state.dj&&s.members[state.dj]?.person.room!==room){state.dj=null;state.revision++;}
}
const MAIN='disque-house-3d-v1';
export const validChannel=(c:unknown):c is string=>typeof c==='string'&&(c===MAIN||/^disque-(room-chat-v1|social-v1|house-play-3d-v1|screening-v1):(garage|living|bar)$/.test(c));
const uuid=(id:unknown):id is string=>typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id);
const targetedHouse=new Set(['invite','accept','decline','cancel','roster','knock','knock-declined','ready','offer','answer','ice','media','end','exit']);
/** Sender ownership and private addressing are enforced before storage/delivery. */
export function exchangeNetwork(s:NetworkState,owner:string,body:any,now:number){
 if(!uuid(body.id)||!Array.isArray(body.messages)||body.messages.length>32||!Array.isArray(body.channels)||body.channels.length>8||!body.channels.every(validChannel))throw new Error('input');
 for(const [id,m]of Object.entries(s.members))if(now-m.seen>90000)delete s.members[id];
 s.packets=s.packets.filter(p=>now-p.at<60000).slice(-1500);
 const previous=s.members[body.id];if(previous&&previous.owner!==owner)throw new Error('identity');
 s.departed=Object.fromEntries(Object.entries(s.departed??{}).filter(([,until])=>until>now));
 const session=`${owner}:${body.id}`;
 if(body.depart===true){delete s.members[body.id];releaseAbsentDJs(s);s.departed[session]=now+90000;return {cursor:s.seq,packets:[],roster:[]};}
 if(s.departed[session])throw new Error('departed');
 if(!previous&&Object.keys(s.members).length>=100)throw new Error('capacity');
 if(previous&&now-previous.seen<250)throw new Error('slow_down');
 let me=previous;
 const seen=new Set(s.packets.map(p=>p.id));
 // Presence establishes membership before room-specific messages in the same batch.
 const ordered=[...body.messages].sort((a,b)=>Number(b?.channel===MAIN&&['hello','person'].includes(b?.data?.event))-Number(a?.channel===MAIN&&['hello','person'].includes(a?.data?.event)));
 for(const raw of ordered){
  if(!uuid(raw?.id)||seen.has(raw.id)||!validChannel(raw.channel)||!raw.data||typeof raw.data!=='object'||Array.isArray(raw.data)||JSON.stringify(raw.data).length>16000)continue;
  const d=structuredClone(raw.data);let to:string|undefined;
  if(raw.channel===MAIN){
   if(['person','hello'].includes(d.event)){
    const person=parsePerson({...d.data,id:body.id});if(!person)continue;
    me={owner,seen:now,person};s.members[body.id]=me;d.data=person;
   }else if(d.event==='leave'){if(!me)continue;}
   else if(targetedHouse.has(d.event)){if(!uuid(d.to))continue;to=d.to;}
   else continue;
  }else{
   if(!me||!raw.channel.endsWith(`:${me.person.room??'garage'}`))continue;
   if(raw.channel.startsWith('disque-screening-')){
    // Browsers submit commands only. Shared snapshots are issued by the server.
    if(d.type!=='command')continue;
    releaseAbsentDJs(s);const room=(me.person.room??'garage') as RoomId;
    s.screenings??={};const before=s.screenings[room]??emptyScreening();
    const next=changeScreening(before,d.command,{id:body.id,name:me.person.name},now);
    s.screenings[room]=next;
    s.packets.push({id:raw.id,channel:raw.channel,data:{type:next===before?'rejected':'ack',from:'house-server',to:body.id},from:'house-server',to:body.id,seq:++s.seq,at:now});seen.add(raw.id);continue;
   }
   if(raw.channel.startsWith('disque-social-')&&d.type!=='preference'){if(!uuid(d.to))continue;to=d.to;}
   if(d.to!==undefined){if(!uuid(d.to))continue;to=d.to;}
   if(raw.channel.startsWith('disque-room-chat-')){
    if(typeof d.text!=='string'||!d.text.trim()||d.text.length>280)continue;
    d.sender=body.id;d.name=me.person.name;d.at=now;
   }
  }
  if(!me||to&&!s.members[to])continue;
  d.from=body.id;
  const packet:Packet={id:raw.id,channel:raw.channel,data:d,from:body.id,to,seq:++s.seq,at:now};s.packets.push(packet);seen.add(raw.id);
  if(raw.channel===MAIN&&d.event==='leave'){delete s.members[body.id];me=undefined;}
 }
 if(me)me.seen=now;
 const cursor=Number.isSafeInteger(body.cursor)&&body.cursor>=0?body.cursor:0;
 const packets=s.packets.filter(p=>p.seq>cursor&&p.from!==body.id&&(!p.to||p.to===body.id)&&body.channels.includes(p.channel)&&
  (p.channel===MAIN||p.channel.endsWith(`:${me?.person.room??'garage'}`)));
 // Only public appearance is bootstrapped; no private history or ownership token.
 const roster=Object.entries(s.members).filter(([id])=>id!==body.id).map(([,m])=>m.person);
 releaseAbsentDJs(s);
 const room=(me?.person.room??'garage') as RoomId;
 const screenings=me&&body.channels.includes(`disque-screening-v1:${room}`)?{[room]:s.screenings?.[room]??emptyScreening()}:{};
 return {cursor:s.seq,packets,roster,screenings,serverNow:now};
}
