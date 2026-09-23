import {concierge,freshConcierge,applyCompanyDecision,companyCandidates,preparedDecision} from './concierge';
import {applyCommand,createLife,parseLife,releaseBed,returnItem,tickLife,type Command,type LifeState,type Visitor} from './model';
export type Connection='connecting'|'local'|'online'|'reconnecting';
/** A single local coordinator is used only when the hosted service is not configured. */
export function createResidentTransport(getVisitor:()=>Visitor,onState:(s:LifeState,mode:Connection)=>void,onResult:(text:string)=>void){
 let state=createLife(),mode:Connection='connecting',closed=false,leader=false,release:(()=>void)|undefined,last=performance.now(),lastPublish=0,fetching=false;
 const visitors=new Map<string,{visitor:Visitor;seen:number}>(),channel=new BroadcastChannel('house-residents-v1');
 let serverToken='',serverId='';
 const pending:Command[]=[];let processed=new Set<string>();
 try{const saved=parseLife(JSON.parse(localStorage.getItem('house-residents-v1')||'null'));if(saved){state=saved;delete state.domestic;delete state.arrivals;state.items.forEach(returnItem);if(state.bed.holder)releaseBed(state,state.bed.holder);state.social.invites=[];state.social.solo={};state.social.welcomed={};state.social.concierge=freshConcierge();state.residents.forEach(r=>{r.path=[];r.until=Date.now()+({dora:4300,teo:8900,biscoito:1700}[r.id]);r.activity='idle';});}}catch{/* private storage: in-memory simulation still works */}
 const emit=()=>onState(structuredClone(state),mode);
 const send=(data:unknown)=>{if(!closed)channel.postMessage(data);};
 function accept(c:Command){if(processed.has(c.id))return;processed.add(c.id);if(processed.size>200)processed=new Set([...processed].slice(-100));
  const eligible=[...visitors.values()].map(p=>({...p.visitor,available:Date.now()-p.seen<8000}));const text=applyCommand(state,c,Date.now(),eligible);
  if(c.action==='askCompany'&&concierge(state).requests[c.visitor.id]?.pending){const request=concierge(state).requests[c.visitor.id];applyCompanyDecision(state,c.visitor.id,c.id,preparedDecision(request.text,companyCandidates(state,c.visitor,eligible,Date.now())),eligible,Date.now());}send({type:'result',id:c.id,visitor:c.visitor.id,text});if(c.visitor.id===getVisitor().id)onResult(text);
 }
 channel.onmessage=({data})=>{if(closed||mode==='online'||!navigator.locks||!data)return;
  if(data.type==='visitor'&&data.visitor&&typeof data.visitor.id==='string'&&Number.isFinite(data.visitor.position?.x)&&Number.isFinite(data.visitor.position?.z))visitors.set(data.visitor.id,{visitor:data.visitor,seen:Date.now()});
  if(data.type==='snapshot'&&!leader){const parsed=parseLife(data.state);if(parsed){state=parsed;emit();}}
  if(data.type==='command'&&leader&&data.command){const c=data.command as Command;const known=visitors.get(c.visitor?.id);if(known)accept({...c,visitor:known.visitor});}
  if(data.type==='result'&&data.visitor===getVisitor().id&&typeof data.text==='string')onResult(data.text.slice(0,220));
  if(data.type==='leave'&&leader){visitors.delete(data.id);releaseBed(state,data.id);state.items.filter(i=>i.holder===data.id).forEach(returnItem);}
  if(data.type==='hello'&&leader)send({type:'snapshot',state});
 };
 async function elect(){if(closed||leader||mode!=='local')return;
  if(!navigator.locks){leader=true;return;}
  await navigator.locks.request('house-residents-leader-v1',{ifAvailable:true},async lock=>{if(!lock||closed||mode!=='local')return;leader=true;send({type:'snapshot',state});await new Promise<void>(r=>{release=r;});leader=false;});
 }
 async function poll(){if(closed||fetching)return;fetching=true;
  const command=pending[0];
  try{const response=await fetch('/api/house-residents',{method:'POST',headers:{'Content-Type':'application/json',...(serverToken?{'X-Resident-Session':serverToken}:{})},body:JSON.stringify({visitor:getVisitor(),command}),signal:AbortSignal.timeout(20000)});
   if(!response.ok){if(response.status===401){serverToken='';serverId='';pending.length=0;mode='reconnecting';emit();onResult('Renovando sua conexão com os moradores. Tente novamente em um instante.');}else if(mode==='connecting'){mode='local';emit();send({type:'hello'});void elect();}else if(mode==='online'){mode='reconnecting';emit();}return;}
   const data=await response.json(),parsed=parseLife(data.state);if(!parsed)throw new Error('invalid state');
   if(closed)return;
   if(typeof data.identity?.token==='string'&&typeof data.identity?.id==='string'){serverToken=data.identity.token;serverId=data.identity.id;}
   const company=concierge(parsed);if(company.requests[serverId]){company.requests[getVisitor().id]=company.requests[serverId];if(serverId!==getVisitor().id)delete company.requests[serverId];}
   company.proposals.forEach(p=>{if(p.from===serverId)p.from=getVisitor().id;if(p.to===serverId)p.to=getVisitor().id;});
   company.circles.forEach(r=>r.members.forEach(m=>{if(m.id===serverId)m.id=getVisitor().id;}));
   parsed.social.invites.forEach(i=>{if(i.from===serverId)i.from=getVisitor().id;if(i.to===serverId)i.to=getVisitor().id;});
   if(serverId in parsed.social.solo){parsed.social.solo[getVisitor().id]=parsed.social.solo[serverId];if(serverId!==getVisitor().id)delete parsed.social.solo[serverId];}
   // The shared service owns its anonymous identity; map only our local display id.
   if(parsed.bed.holder===serverId)parsed.bed.holder=getVisitor().id;
   parsed.items.forEach(item=>{if(item.holder===serverId)item.holder=getVisitor().id;});
   mode='online';release?.();state=parsed;if(command&&data.commandId===command.id){pending.shift();onResult(data.result||'Pronto.');}emit();
  }catch{if(mode==='connecting'){mode='local';emit();send({type:'hello'});void elect();}else if(mode==='online'){mode='reconnecting';emit();}}
  finally{fetching=false;}
 }
 const timer=setInterval(()=>{if(closed)return;const now=Date.now(),v=getVisitor();visitors.set(v.id,{visitor:v,seen:now});
  if(mode==='local'){
   const dt=(performance.now()-last)/1000;last=performance.now();
   if(leader){for(const[id,p]of visitors)if(now-p.seen>90000){visitors.delete(id);releaseBed(state,id);state.items.filter(i=>i.holder===id).forEach(returnItem);}
    tickLife(state,dt,[...visitors.values()].map(p=>({...p.visitor,available:now-p.seen<8000})),now);
   }
   if(now-lastPublish>500){lastPublish=now;send({type:'visitor',visitor:v});if(leader){send({type:'snapshot',state});emit();try{localStorage.setItem('house-residents-v1',JSON.stringify(state));}catch{/* optional continuity */}}}
  }
 },100);
 const heartbeat=setInterval(()=>{if(mode==='local'){void elect();}else void poll();},1800);
 void poll();
 return {get state(){return state;},get mode(){return mode;},command(action:Command['action'],target:string,request?:string){const c:Command={id:crypto.randomUUID(),visitor:getVisitor(),action,target,request};
  if(mode==='local'){send({type:'visitor',visitor:c.visitor});visitors.set(c.visitor.id,{visitor:c.visitor,seen:Date.now()});if(leader)accept(c);else send({type:'command',command:c});}
  else if(mode==='online'){if(pending.length<2){pending.push(c);void poll();}}
  else onResult('A casa está reconectando. Tente em um instante.');
 },dispose(){if(leader){releaseBed(state,getVisitor().id);state.items.filter(i=>i.holder===getVisitor().id).forEach(returnItem);send({type:'snapshot',state});}send({type:'leave',id:getVisitor().id});closed=true;release?.();clearInterval(timer);clearInterval(heartbeat);channel.close();}};
}
