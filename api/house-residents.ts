import {publicInterestTags} from '../src/garage3d/residents/welcome.ts';
import {improviseEpisode,attachEpisodeRewrite} from '../server/domesticDialogue.ts';
import houseNetwork from '../server/houseNetworkHandler.ts';
import {concierge,companyCandidates,applyCompanyDecision,preparedDecision,quickPreference} from '../src/garage3d/residents/concierge.ts';
import {chooseCompany,invitationLine} from '../server/houseConcierge.ts';
import {normalizeSeat} from '../src/garage/seats.ts';
import {HOST_ACTIONS,personalLife} from '../src/garage3d/residents/social.ts';
import type { VercelRequest,VercelResponse } from '@vercel/node';
import {createClient} from '@supabase/supabase-js';
import {createLife,parseLife,tickLife,applyCommand,releaseBed,returnItem,type Visitor,type Command,type LifeState} from '../src/garage3d/residents/model.ts';
import {roomAt} from '../src/garage3d/layout.ts';
import {residentIdentity} from '../server/residentIdentity.ts';
import {handlePoker} from '../server/housePoker.ts';
import type {PokerState} from '../src/garage3d/poker/model.ts';
type World={network?:import('../server/houseNetwork.ts').NetworkState;pokerCall?:import('../server/pokerCall.ts').PokerCall;poker?:PokerState;pokerCommands?:Record<string,string>;state:LifeState;visitors:Record<string,{visitor:Visitor;seen:number}>;at:number;nextAI:number;commands:Record<string,string>};
const ACTIONS=new Set([...HOST_ACTIONS,'pick','return','coffee','water','record','throw','pet','greet','fill','rest','talk','moveBed','placeBed','cancelBed']);
const TARGETS=new Set(['dora','teo','biscoito','plant','coffee','watering','record','toy','bed','bowl']);
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.body?.feature==='network')return houseNetwork(req,res);
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'method'});
 const origin=req.headers.origin;
 if(origin){try{if(new URL(origin).host!==req.headers.host)return res.status(403).json({error:'origin'});}catch{return res.status(403).json({error:'origin'});}}
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return res.status(503).json({configured:false});
 const identity=residentIdentity(req.headers['x-resident-session'],key);if(!identity)return res.status(401).json({error:'session'});
 const body=req.body;
 if(!body||JSON.stringify(body).length>6000)return res.status(400).json({error:'input'});
 const raw=body.visitor;
 if(!raw||typeof raw.id!=='string'||!/^[a-f0-9-]{36}$/.test(raw.id)||typeof raw.name!=='string'||!Number.isFinite(raw.position?.x)||!Number.isFinite(raw.position?.z)||!roomAt(raw.position))return res.status(400).json({error:'visitor'});
 const visitor:Visitor={adult:raw.adult===true,id:identity.id,name:raw.name.replace(/[<>\r\n]/g,'').slice(0,24),position:{x:raw.position.x,z:raw.position.z},seat:normalizeSeat(raw.seat,roomAt(raw.position)),frozen:raw.frozen===true,publicInterests:publicInterestTags(raw.publicInterests),publicId:raw.id,blocked:Array.isArray(raw.blocked)?raw.blocked.filter((id:unknown)=>typeof id==='string'&&id.length<=100).slice(0,100):[]};
 visitor.name=visitor.name.trim()||'Visitante';
 if(body.feature==='poker')return handlePoker(body,res,url,key,identity,visitor);
 const command=body.command;
 if(command&&(!ACTIONS.has(command.action)||!(TARGETS.has(command.target)||(HOST_ACTIONS.has(command.action)&&typeof command.target==='string'&&command.target.length<=100))||typeof command.id!=='string'||!/^[a-f0-9-]{36}$/.test(command.id)))return res.status(400).json({error:'command'});
 if(command?.action==='askCompany'&&(typeof command.request!=='string'||command.request.trim().length<3||command.request.length>240))return res.status(400).json({error:'request'});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),now=Date.now();
 for(let attempt=0;attempt<4;attempt++){
  const {data,error}=await db.from('house_resident_world').select('revision,payload').eq('id','main').single();
  if(error||!data)return res.status(503).json({configured:false});
  const saved=data.payload as Partial<World>,state=parseLife(saved.state)??createLife(now);
  const world:World={network:saved.network,pokerCall:saved.pokerCall,poker:saved.poker,pokerCommands:saved.pokerCommands,state,visitors:saved.visitors??{},at:saved.at??now,nextAI:saved.nextAI??now+15000,commands:saved.commands??{}};
  for(const[id,p]of Object.entries(world.visitors))if(now-p.seen>90000){delete world.visitors[id];releaseBed(state,id);state.items.filter(i=>i.holder===id).forEach(returnItem);}
  if(Object.keys(world.visitors).length>=100&&!world.visitors[visitor.id])return res.status(429).json({error:'capacity'});
  const previous=world.visitors[visitor.id];
  if(previous&&now-previous.seen<350)return res.status(429).json({error:'slow_down'});
  world.visitors[visitor.id]={visitor,seen:now};
  const elapsed=Math.min(10000,Math.max(0,now-world.at));
  for(let t=0;t<elapsed;t+=200)tickLife(state,Math.min(200,elapsed-t)/1000,Object.values(world.visitors).map(p=>({...p.visitor,available:now-p.seen<8000})),world.at+t);
  world.at=now;
  let result:string|undefined;
  if(command){result=world.commands[command.id];if(!result){result=applyCommand(state,{...command,visitor} as Command,now,Object.values(world.visitors).map(p=>({...p.visitor,available:now-p.seen<8000})));world.commands[command.id]=result;world.commands=Object.fromEntries(Object.entries(world.commands).slice(-100));}}
  const companyRequest=concierge(state).requests[visitor.id];
  const selecting=command?.action==='askCompany'&&companyRequest?.id===command.id&&companyRequest.pending;
  const eligible=Object.values(world.visitors).map(p=>({...p.visitor,available:now-p.seen<8000}));
  const candidates=selecting?companyCandidates(state,visitor,eligible,now):[];
  const evaluate=selecting&&!quickPreference(companyRequest.text)&&candidates.length>0&&!!process.env.TYPESAFE_API_KEY&&(state.cooldown['company-global']??0)<=now;
  if(evaluate){state.cooldown[`company-check:${visitor.id}`]=now+10000;state.cooldown['company-global']=now+10000;companyRequest.pending=false;/* Persist the API reservation before any external call. */}
  else if(selecting)applyCompanyDecision(state,visitor.id,command.id,preparedDecision(companyRequest.text,candidates),eligible,now);
  const episodeReady=state.domestic?.phase==='gather'&&state.domestic.beat===0&&!state.domestic.lines;
  const generate=!selecting&&!!process.env.DEEPINFRA_API_KEY&&now>=world.nextAI&&episodeReady;
  if(generate)world.nextAI=now+120000;
  const {data:written,error:writeError}=await db.from('house_resident_world').update({revision:data.revision+1,payload:world,updated_at:new Date(now).toISOString()}).eq('id','main').eq('revision',data.revision).select('revision');
  if(writeError)return res.status(503).json({configured:false});if(!written?.length)continue;
  if(evaluate){
   const decision=await chooseCompany(companyRequest.text,candidates);
   decision.line=await invitationLine(decision,companyRequest.host);
   for(let retry=0;retry<4;retry++){
    const {data:latest}=await db.from('house_resident_world').select('revision,payload').eq('id','main').single();
    if(!latest||!parseLife(latest.payload.state))break;
    const current=concierge(latest.payload.state).requests[visitor.id];
    if(current?.id!==command.id||current.expires<=Date.now())break;
    current.pending=true;
    const fresh=Object.values(latest.payload.visitors as World['visitors']).map(p=>({...p.visitor,available:Date.now()-p.seen<8000}));
    applyCompanyDecision(latest.payload.state,visitor.id,command.id,decision,fresh,Date.now());
    const {data:updated}=await db.from('house_resident_world').update({revision:latest.revision+1,payload:latest.payload}).eq('id','main').eq('revision',latest.revision).select('revision');
    if(updated?.length){world.state=latest.payload.state;break;}
   }
  }
  if(generate){try{const rewrite=await improviseEpisode(state.domestic!);if(rewrite){
   // Revision and scene identity both protect intervening visitor actions.
   const {data:latest}=await db.from('house_resident_world').select('revision,payload').eq('id','main').single();
   const parsed=latest&&parseLife(latest.payload.state);
   if(parsed&&attachEpisodeRewrite(parsed,rewrite,Date.now())){latest.payload.state=parsed;await db.from('house_resident_world').update({revision:latest.revision+1,payload:latest.payload}).eq('id','main').eq('revision',latest.revision);}
  }}catch{console.warn('resident_generation',{model:'zai-org/GLM-5.3-Flash',status:'unavailable'});/* Authored scenes continue without the provider. */}}
  if(generate){const {data:fresh}=await db.from('house_resident_world').select('payload').eq('id','main').single();if(fresh&&parseLife(fresh.payload.state))world.state=fresh.payload.state;}
  return res.status(200).json({state:personalLife(world.state,visitor.id),identity,commandId:command?.id,result,generative:!!process.env.DEEPINFRA_API_KEY});
 }
 return res.status(409).json({error:'retry'});
}
