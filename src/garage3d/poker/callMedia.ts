/** Owns capture even while permission prompts or mask initialization are pending. */
export function createPokerMedia(deps:{
 acquire:(kind:'video'|'audio')=>Promise<MediaStream>;
 mask:(raw:MediaStream)=>Promise<MediaStream>;
 publish:(track:MediaStreamTrack,kind:'video'|'audio')=>Promise<unknown>;
 unpublish:(track:MediaStreamTrack)=>Promise<unknown>;
 changed:()=>void;
}){
 const versions={video:0,audio:0},streams=new Map<'video'|'audio',MediaStream>(),pending=new Map<MediaStream,'video'|'audio'>();
 const stop=(s:MediaStream)=>s.getTracks().forEach(t=>t.stop());
 async function off(kind:'video'|'audio'){
  versions[kind]++;
  for(const[s,k]of pending)if(k===kind){stop(s);pending.delete(s);}
  const old=streams.get(kind);streams.delete(kind);deps.changed();
  if(old){stop(old);await Promise.allSettled(old.getTracks().map(t=>deps.unpublish(t)));}
 }
 async function on(kind:'video'|'audio',masked:boolean){
  const version=versions[kind]+1;await off(kind);if(version!==versions[kind])return;let raw:MediaStream|undefined,output:MediaStream|undefined;
  try{
   raw=await deps.acquire(kind);pending.set(raw,kind);
   if(versions[kind]!==version){stop(raw);return;}
   output=kind==='video'&&masked?await deps.mask(raw):raw;pending.set(output,kind);
   if(versions[kind]!==version){stop(output);stop(raw);return;}
   const track=output.getTracks()[0];if(!track)throw new Error('no track');
   await deps.publish(track,kind);
   if(versions[kind]!==version){stop(output);stop(raw);await deps.unpublish(track);return;}
   streams.set(kind,output);deps.changed();
  }catch(error){if(output)stop(output);if(raw)stop(raw);if(versions[kind]===version)throw error;}
  finally{if(raw)pending.delete(raw);if(output)pending.delete(output);}
 }
 return {on,off,get:(kind:'video'|'audio')=>streams.get(kind),stop:()=>Promise.all([off('video'),off('audio')])};
}
