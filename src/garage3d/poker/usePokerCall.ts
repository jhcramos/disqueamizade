import {useEffect,useRef,useState} from 'react';
import {Room,RoomEvent,Track,type Participant} from 'livekit-client';
import type {Appearance} from '../../garage/avatarStyle';
import {acquireGarageMedia} from '../../garage/media';
import {readCameraMaskChoice,saveCameraMaskChoice} from '../../garage/cameraPreference';
import {createPokerMedia} from './callMedia';
export type CallReply={credentials?:{url:string;token:string;session:string};call?:{available:boolean;joined:boolean;count:number}};
export type CallTile={id:string;name:string;self:boolean;audioOn:boolean;video?:MediaStream;audio?:MediaStream};
export function usePokerCall(options:{request:(action:'join'|'leave')=>Promise<CallReply>;avatar:number;appearance:Appearance;onActive?:(active:boolean)=>void}){
 const opts=useRef(options);opts.current=options;
 const [status,setStatus]=useState<'idle'|'connecting'|'connected'>('idle'),[tiles,setTiles]=useState<CallTile[]>([]),[notice,setNotice]=useState(''),[masked,setMasked]=useState(readCameraMaskChoice),[pending,setPending]=useState(false);
 const room=useRef<Room>(),media=useRef<ReturnType<typeof createPokerMedia>>(),generation=useRef(0),mounted=useRef(true),busy=useRef(false),joining=useRef(false),active=useRef(false),lastContact=useRef(Date.now()),connectedAt=useRef(0);
 function refresh(){const r=room.current;if(!r||!mounted.current)return;
  const tile=(p:Participant,self:boolean):CallTile=>{
   const tracks=[...p.trackPublications.values()].filter(t=>!t.isMuted&&t.track);
   const video=tracks.find(t=>t.source===Track.Source.Camera)?.track?.mediaStreamTrack;
   const audio=tracks.find(t=>t.source===Track.Source.Microphone)?.track?.mediaStreamTrack;
   return {id:p.identity,name:p.name||'Visitante',self,audioOn:!!audio,video:video?new MediaStream([video]):undefined,audio:!self&&audio?new MediaStream([audio]):undefined};
  };
  setTiles([tile(r.localParticipant,true),...[...r.remoteParticipants.values()].map(p=>tile(p,false))].slice(0,4));
 }
 async function leave(notify=true){
  const wasActive=active.current;generation.current++;active.current=false;busy.current=false;const r=room.current;room.current=undefined;const m=media.current;media.current=undefined;
  // Invalidate/stop capture synchronously before any network operation.
  void m?.stop();r?.removeAllListeners();void r?.disconnect();opts.current.onActive?.(false);
  if(mounted.current){setStatus('idle');setTiles([]);setPending(false);}
  if(notify&&wasActive)try{await opts.current.request('leave');}catch{/* membership expires; local tracks are already stopped */}
 }
 async function join(){
  if(active.current||busy.current||joining.current)return;joining.current=true;busy.current=true;active.current=true;const version=++generation.current;setStatus('connecting');setNotice('');opts.current.onActive?.(true);
  try{
   const data=await opts.current.request('join');
   if(version!==generation.current){await opts.current.request('leave');return;}
   if(!data.credentials)throw new Error('A conversa está indisponível.');
   const r=new Room({adaptiveStream:true,dynacast:true,disconnectOnPageLeave:true});room.current=r;
   const m=createPokerMedia({acquire:acquireGarageMedia,mask:async raw=>{const {createAvatarCameraStream}=await import('../../garage/avatarCamera');return createAvatarCameraStream(raw,opts.current.avatar,opts.current.appearance);},
    publish:(track,kind)=>r.localParticipant.publishTrack(track,{source:kind==='video'?Track.Source.Camera:Track.Source.Microphone,simulcast:false,videoEncoding:{maxBitrate:450000,maxFramerate:20}}),
    unpublish:track=>r.localParticipant.unpublishTrack(track),changed:refresh});media.current=m;
   for(const event of [RoomEvent.TrackSubscribed,RoomEvent.TrackUnsubscribed,RoomEvent.TrackMuted,RoomEvent.TrackUnmuted,RoomEvent.LocalTrackPublished,RoomEvent.LocalTrackUnpublished,RoomEvent.ParticipantDisconnected])r.on(event,refresh);
   r.on(RoomEvent.ParticipantConnected,()=>{void m.stop();refresh();setNotice('Alguém entrou na conversa. Câmera e microfone pausados; ative-os quando quiser.');});
   r.on(RoomEvent.Disconnected,()=>{if(room.current===r){void leave();if(mounted.current)setNotice('A conversa foi desconectada. A partida continua.');}});
   await r.connect(data.credentials.url,data.credentials.token);
   if(version!==generation.current){void r.disconnect();return;}
   lastContact.current=Date.now();connectedAt.current=Date.now();setStatus('connected');refresh();
  }catch(error){if(version===generation.current){await leave();if(mounted.current)setNotice(error instanceof Error?error.message:'Não foi possível conectar.');}}
  finally{joining.current=false;if(version===generation.current)busy.current=false;}
 }
 async function toggle(kind:'video'|'audio'){
  const m=media.current;if(!m||status!=='connected'||busy.current)return;const version=generation.current;busy.current=true;setPending(true);setNotice('');
  try{if(m.get(kind))await m.off(kind);else await m.on(kind,masked);}
  catch{if(version===generation.current)setNotice(kind==='video'?'Não foi possível ativar a câmera ou a máscara. Seu vídeo continua desligado.':'Não foi possível ativar o microfone. Verifique a permissão do navegador.');}
  finally{if(version===generation.current){busy.current=false;setPending(false);refresh();}}
 }
 function changeMask(value:boolean){void media.current?.off('video');setMasked(value);saveCameraMaskChoice(value);setNotice('Escolha atualizada. Ative a câmera quando estiver pronto.');}
 function sync(data:CallReply,startedAt:number){if(startedAt<connectedAt.current)return;lastContact.current=Date.now();if(active.current&&status==='connected'&&!data.call?.joined){void leave(false);setNotice('Você saiu da conversa da mesa. Suas mídias foram desligadas.');}}
 useEffect(()=>{mounted.current=true;const end=()=>{void leave();};window.addEventListener('pagehide',end);const timer=setInterval(()=>{if(active.current&&Date.now()-lastContact.current>20000){void leave();setNotice('Conexão com a mesa interrompida. Câmera e microfone desligados.');}},3000);return()=>{mounted.current=false;clearInterval(timer);window.removeEventListener('pagehide',end);void leave();};},[]);
 return {status,tiles,notice,masked,pending,join,leave,toggle,changeMask,sync,active};
}
