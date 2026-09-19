import {useEffect,useRef,useState} from 'react';
import {HouseChannel,usesHouseNetwork} from '../../garage/network/HouseChannel';
import type {RoomId} from '../../garage/model';
import type {BodyPose} from './pose';
import {packPose,parseWirePose,unpackPose,POSE_TTL} from './wire';
export type RemoteMotion={pose:BodyPose;at:number};
export function useSharedMotion(room:RoomId,id:string|undefined,enabled:boolean){
 const frames=useRef(new Map<string,RemoteMotion>()),bus=useRef<HouseChannel>();
 const [sharing,setSharing]=useState(false),[connected,setConnected]=useState(false);
 const permitted=useRef(false);permitted.current=sharing&&enabled;
 const last=useRef(0),sent=useRef(false);
 function publish(pose:BodyPose|null){
  const channel=bus.current,now=performance.now();
  const next=permitted.current&&channel?.connected&&pose?packPose(pose):null;
  if(!channel||(!next&&!sent.current)||(next&&now-last.current<250))return;
  last.current=now;sent.current=!!next;
  channel.postMessage({type:'pose',from:id,pose:next,captured:performance.timeOrigin+now});
 }
 function choose(value:boolean){permitted.current=value&&enabled;setSharing(value);if(!value)publish(null);}
 useEffect(()=>{
  frames.current.clear();sent.current=false;setConnected(false);
  if(!enabled||!id)return;
  const channel=new HouseChannel(`disque-avatar-motion-v1:${room}`);bus.current=channel;setConnected(channel.connected);
  channel.onconnectionchange=setConnected;
  channel.onmessage=({data:m})=>{
   const now=performance.now();
   if(usesHouseNetwork()){
    if(m?.type!=='snapshot'||!Array.isArray(m.poses))return;
    frames.current.clear();
    for(const p of m.poses){const pose=parseWirePose(p.pose);if(p.id!==id&&typeof p.id==='string'&&p.room===room&&pose&&Number.isFinite(p.age)&&p.age>=0&&p.age<POSE_TTL)frames.current.set(p.id,{pose:unpackPose(pose),at:now-p.age});}
   }else if(m?.type==='pose'&&m.from!==id&&typeof m.from==='string'){
    const pose=parseWirePose(m.pose);if(pose)frames.current.set(m.from,{pose:unpackPose(pose),at:now});else frames.current.delete(m.from);
   }
  };
  return()=>{channel.postMessage({type:'pose',from:id,pose:null,captured:performance.timeOrigin+performance.now()});channel.close();bus.current=undefined;frames.current.clear();};
 },[room,id,enabled]);
 return {frames,sharing,connected,choose,publish};
}
