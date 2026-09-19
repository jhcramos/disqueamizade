import {AccessToken} from 'livekit-server-sdk';
/** This token cannot publish or subscribe to camera/audio tracks. */
export async function motionCredentials(member:{owner:string;seen:number;person:{room?:string}}|undefined,owner:string,id:string,room:unknown,now:number){
 if(!member||member.owner!==owner||now-member.seen>90000||member.person.room!==room||!['garage','living','bar'].includes(String(room)))return null;
 if(!process.env.LIVEKIT_URL||!process.env.LIVEKIT_API_KEY||!process.env.LIVEKIT_API_SECRET)return null;
 const token=new AccessToken(process.env.LIVEKIT_API_KEY,process.env.LIVEKIT_API_SECRET,{identity:id,ttl:60});
 token.addGrant({roomJoin:true,room:`house-motion-v1-${room}`,canPublish:false,canSubscribe:false,canPublishData:true});
 return {url:process.env.LIVEKIT_URL,token:await token.toJwt()};
}
