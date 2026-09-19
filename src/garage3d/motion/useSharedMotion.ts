import {useEffect,useRef,useState} from 'react';
import {HouseChannel,usesHouseNetwork} from '../../garage/network/HouseChannel';
import type {RoomId} from '../../garage/model';
import type {BodyPose} from './pose';
import {packPose,parseWirePose,unpackPose,POSE_TTL} from './wire';
import type {Room} from 'livekit-client';
export type RemoteMotion={pose:BodyPose;at:number};
export function useSharedMotion(room:RoomId,id:string|undefined,enabled:boolean){
 const frames=useRef(new Map<string,RemoteMotion>()),bus=useRef<HouseChannel>(),live=useRef<Room>();
 const [sharing,setSharing]=useState(false),[connected,setConnected]=useState(false),[realtime,setRealtime]=useState(false);
 const permitted=useRef(false);permitted.current=sharing&&enabled;
 const last=useRef(0),lastFast=useRef(0),sent=useRef(false),sentFast=useRef(false);
 function publish(pose:BodyPose|null){
  const channel=bus.current,now=performance.now();
  const next=permitted.current&&channel?.connected&&pose?packPose(pose):null;
  const rtc=live.current;
  if(rtc?.state==='connected'&&((next&&now-lastFast.current>=83)||(!next&&sentFast.current))){
   lastFast.current=now;sentFast.current=!!next;
   const bytes=new TextEncoder().encode(JSON.stringify({pose:next,captured:performance.timeOrigin+now}));
   void rtc.localParticipant.publishData(bytes,{topic:'avatar-pose-v1',reliable:next===null}).catch(()=>{});
  }
  // Slow snapshots remain available for visitors whose realtime connection fails.
  if(!channel||(!next&&!sent.current)||(next&&now-last.current<250))return;
  last.current=now;sent.current=!!next;
  channel.postMessage({type:'pose',from:id,pose:next,captured:performance.timeOrigin+now});
 }
 function choose(value:boolean){permitted.current=value&&enabled;setSharing(value);if(!value)publish(null);}
 useEffect(()=>{
  frames.current.clear();sent.current=false;sentFast.current=false;setConnected(false);setRealtime(false);
  if(!enabled||!id)return;
  let closed=false,joining=false;const fast=new Map<string,{pose:BodyPose|null;at:number;captured:number}>();
  const channel=new HouseChannel(`disque-avatar-motion-v1:${room}`);bus.current=channel;setConnected(channel.connected);
  channel.onconnectionchange=setConnected;
  async function connect(){
   if(closed||document.hidden||joining||live.current||!channel.connected||!usesHouseNetwork()||import.meta.env.VITE_ENABLE_AVATAR_MOTION_REALTIME==='false')return;
   joining=true;
   try{const credentials=await channel.motionCredentials(room);if(closed)return;
    const {Room,RoomEvent}=await import('livekit-client');if(closed)return;
    const rtc=new Room({disconnectOnPageLeave:true});live.current=rtc;
    rtc.on(RoomEvent.DataReceived,(bytes,participant,_kind,topic)=>{
     if(closed||topic!=='avatar-pose-v1'||!participant||bytes.byteLength>256)return;
     const peer=participant.identity;if(peer===id)return;
     try{const data=JSON.parse(new TextDecoder().decode(bytes)),pose=parseWirePose(data.pose),previous=fast.get(peer);
      if((!pose&&data.pose!==null)||!Number.isFinite(data.captured)||data.captured<=(previous?.captured??0))return;
      const at=performance.now(),body=pose?unpackPose(pose):null;fast.set(peer,{pose:body,at,captured:data.captured});
      if(body)frames.current.set(peer,{pose:body,at});else frames.current.delete(peer);
     }catch{/* Ignore malformed or unrelated data. */}
    });
    rtc.on(RoomEvent.ParticipantDisconnected,p=>{fast.delete(p.identity);frames.current.delete(p.identity);});
    rtc.on(RoomEvent.ConnectionStateChanged,state=>{if(!closed)setRealtime(state==='connected');});
    rtc.on(RoomEvent.Disconnected,()=>{if(live.current===rtc)live.current=undefined;});
    await rtc.connect(credentials.url,credentials.token,{autoSubscribe:false});if(closed)await rtc.disconnect();
   }catch{const rtc=live.current;live.current=undefined;void rtc?.disconnect();if(!closed)setRealtime(false);}
   finally{joining=false;}
  }
  const timer=setInterval(()=>void connect(),5000);void connect();
  channel.onmessage=({data:m})=>{
   const now=performance.now();
   if(usesHouseNetwork()){
    if(m?.type!=='snapshot'||!Array.isArray(m.poses))return;
    frames.current.clear();
    for(const p of m.poses){const pose=parseWirePose(p.pose);if(p.id!==id&&typeof p.id==='string'&&p.room===room&&pose&&Number.isFinite(p.age)&&p.age>=0&&p.age<POSE_TTL)frames.current.set(p.id,{pose:unpackPose(pose),at:now-p.age});}
    for(const [peer,frame]of fast){if(now-frame.at>=POSE_TTL){fast.delete(peer);continue;}if(frame.pose)frames.current.set(peer,{pose:frame.pose,at:frame.at});else frames.current.delete(peer);}
    void connect();
   }else if(m?.type==='pose'&&m.from!==id&&typeof m.from==='string'){
    const pose=parseWirePose(m.pose);if(pose)frames.current.set(m.from,{pose:unpackPose(pose),at:now});else frames.current.delete(m.from);
   }
  };
  return()=>{closed=true;clearInterval(timer);void live.current?.disconnect();live.current=undefined;channel.postMessage({type:'pose',from:id,pose:null,captured:performance.timeOrigin+performance.now()});channel.close();bus.current=undefined;frames.current.clear();};
 },[room,id,enabled]);
 return {frames,sharing,connected,realtime,choose,publish};
}
