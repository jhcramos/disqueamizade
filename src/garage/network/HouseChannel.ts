type Data=Record<string,any>;
type Packet={id:string;channel:string;data:Data};
type Status='connecting'|'online'|'reconnecting';
export const usesHouseNetwork=()=>import.meta.env.PROD||new URLSearchParams(location.search).has('network');
let shared:Hub|undefined;
class Hub{
 channels=new Set<HouseChannel>();known=new Set<string>();id='';token='';cursor=0;queue:Packet[]=[];status:Status='connecting';busy=false;closed=false;
 timer:ReturnType<typeof setTimeout>|undefined;abort:AbortController|undefined;last=0;
 notify(s:Status){if(s===this.status)return;this.status=s;for(const c of this.channels)c.onconnectionchange?.(s==='online');}
 push(channel:string,data:Data){
  const coalesce=['person','hello'].includes(data.event)||['preference','state','snapshot'].includes(data.type);
  if(coalesce)this.queue=this.queue.filter(p=>p.channel!==channel||p.data.event!==data.event||p.data.type!==data.type);
  if(this.queue.length>=128){this.notify('reconnecting');return;}
  this.queue.push({id:crypto.randomUUID(),channel,data});
 }
 schedule(ms=800){clearTimeout(this.timer);if(!this.closed)this.timer=setTimeout(()=>void this.poll(),ms);}
 async request(body:unknown){const r=await fetch('/api/house-residents',{method:'POST',headers:{'Content-Type':'application/json',...(this.token?{'X-House-Session':this.token}:{})},body:JSON.stringify({...body as Data,feature:"network"}),signal:this.abort?.signal});if(!r.ok)throw new Error(String(r.status));return r.json();}
 async poll(){
  if(this.busy||this.closed||!this.id)return;this.busy=true;this.abort=new AbortController();const timeout=setTimeout(()=>this.abort?.abort(),12000);
  const batch=this.queue.slice(0,32);const channels=[...new Set([...this.channels].map(c=>c.name))];
  try{
   if(!this.token){const auth=await this.request({hello:true});this.token=auth.token;}
   const result=await this.request({id:this.id,cursor:this.cursor,channels,messages:batch});if(this.closed)return;
   this.last=Date.now();this.notify('online');this.cursor=result.cursor;
   const sent=new Set(batch.map(m=>m.id));this.queue=this.queue.filter(m=>!sent.has(m.id));
   // Fresh presence snapshots are never mistaken for room-switch departures.
   const roster=result.roster??[],fresh=new Set<string>(roster.map((p:Data)=>p.id));
   for(const id of this.known)if(!fresh.has(id))this.deliver('disque-house-3d-v1',{event:'leave',from:id});
   this.known=fresh;
   for(const person of roster)this.deliver('disque-house-3d-v1',{event:'person',from:person.id,data:person});
   for(const [room,state]of Object.entries(result.screenings??{}))this.deliver(`disque-screening-v1:${room}`,{type:'state',from:'house-server',state,serverNow:result.serverNow});
   for(const packet of result.packets??[])if(!(packet.channel==='disque-house-3d-v1'&&['person','hello','leave'].includes(packet.data.event)))this.deliver(packet.channel,packet.data);
  }catch{if(!this.closed)this.notify('reconnecting');}
  finally{clearTimeout(timeout);this.busy=false;this.schedule((this.status==='online'?800:2000)+Math.random()*200);}
 }
 deliver(name:string,data:Data){for(const c of this.channels)if(c.name===name)c.onmessage?.({data});}
 close(){this.closed=true;clearTimeout(this.timer);this.abort?.abort();
  if(this.token&&this.id)void fetch('/api/house-residents',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json','X-House-Session':this.token},body:JSON.stringify({feature:"network",id:this.id,depart:true,cursor:this.cursor,channels:['disque-house-3d-v1'],messages:[]})}).catch(()=>{});
  this.queue=[];shared=undefined;}
}
/** Same event protocol in development and on the server; production never silently falls back to same-browser delivery. */
export class HouseChannel{
 onmessage:((event:{data:any})=>void)|null=null;
 onconnectionchange:((connected:boolean)=>void)|null=null;
 local?:BroadcastChannel;hub?:Hub;
 constructor(readonly name:string,owner?:string){
  if(!usesHouseNetwork()){this.local=new BroadcastChannel(name);this.local.onmessage=e=>this.onmessage?.(e);return;}
  const hub=shared??(shared=new Hub());this.hub=hub;hub.channels.add(this);if(owner)hub.id=owner;hub.schedule(0);
 }
 get connected(){return this.local?true:this.hub?.status==='online';}
 postMessage(data:unknown){if(!data||typeof data!=='object'||Array.isArray(data))return;if(this.local)this.local.postMessage(data);else this.hub?.push(this.name,structuredClone(data) as Data);}
 close(){this.local?.close();const hub=this.hub;if(hub){hub.channels.delete(this);if(!hub.channels.size)hub.close();}this.hub=undefined;this.onmessage=null;this.onconnectionchange=null;}
}
