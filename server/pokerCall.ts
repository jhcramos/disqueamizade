import {randomUUID} from 'node:crypto';
import {AccessToken,RoomServiceClient,TrackSource} from 'livekit-server-sdk';
import type {PokerState} from '../src/garage3d/poker/model.ts';
export type PokerCall={room:string;members:{id:string;session:string;requestId:string;seen:number}[]};
export const callConfigured=()=>!!(process.env.LIVEKIT_URL&&process.env.LIVEKIT_API_KEY&&process.env.LIVEKIT_API_SECRET);
function service(){return new RoomServiceClient(process.env.LIVEKIT_URL!.replace(/^ws/,'http'),process.env.LIVEKIT_API_KEY,process.env.LIVEKIT_API_SECRET,{requestTimeout:5});}
export function nextPokerCall(previous:PokerCall|undefined,game:PokerState,id:string,command:{action:string;id:string}|undefined,active:boolean,now:number){
 const call:PokerCall=previous?structuredClone(previous):{room:`house-poker-${randomUUID()}`,members:[]};
 call.members=call.members.filter(m=>game.players.some(p=>p.id===m.id&&!p.left)&&now-m.seen<45000);
 if(active){const member=call.members.find(m=>m.id===id);if(member)member.seen=now;}
 if(command?.action==='leave')call.members=call.members.filter(m=>m.id!==id);
 if(command?.action==='join'&&!call.members.some(m=>m.id===id))call.members.push({id,session:`${id}:${randomUUID()}`,requestId:command.id,seen:now});
 return call;
}
export async function preparePokerRoom(room:string){await service().createRoom({name:room,maxParticipants:4,emptyTimeout:60,departureTimeout:20});}
export async function pokerCredentials(call:PokerCall,id:string,name:string){
 const member=call.members.find(m=>m.id===id);if(!member)throw new Error('not a call member');
 const token=new AccessToken(process.env.LIVEKIT_API_KEY,process.env.LIVEKIT_API_SECRET,{identity:member.session,name,ttl:60});
 token.addGrant({roomJoin:true,room:call.room,canSubscribe:true,canPublish:true,canPublishData:false,canPublishSources:[TrackSource.CAMERA,TrackSource.MICROPHONE]});
 return {url:process.env.LIVEKIT_URL,token:await token.toJwt(),session:member.session};
}
export async function revokePokerMembers(previous:PokerCall|undefined,next:PokerCall){
 if(!previous||!callConfigured())return;
 await Promise.allSettled(previous.members.filter(m=>!next.members.some(n=>n.session===m.session)).map(m=>service().removeParticipant(previous.room,m.session)));
 // Rooms expire automatically. Never delete a room that a concurrent join may have reused.
}
