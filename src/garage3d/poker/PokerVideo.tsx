import {useEffect,useRef,useState} from 'react';
import type {usePokerCall,CallTile} from './usePokerCall';
function Media({stream,audio=false}:{stream:MediaStream;audio?:boolean}){
 const ref=useRef<HTMLVideoElement&HTMLAudioElement>(null),[blocked,setBlocked]=useState(false);
 useEffect(()=>{const el=ref.current;if(!el)return;el.srcObject=stream;void el.play().then(()=>setBlocked(false)).catch(()=>setBlocked(true));return()=>{el.srcObject=null;};},[stream]);
 return <>{audio?<audio ref={ref} autoPlay/>:<video ref={ref} autoPlay playsInline muted/>}{blocked&&<button onClick={()=>{void ref.current?.play().then(()=>setBlocked(false));}}>Reproduzir {audio?'áudio':'vídeo'}</button>}</>;
}
export function PokerAudio({tiles}:{tiles:CallTile[]}){return <div className="poker-audio">{tiles.filter(t=>t.audio).map(t=><Media key={t.id} stream={t.audio!} audio/>)}</div>;}
export function PokerVideo({call,seated,unavailable,onPreview}:{call:ReturnType<typeof usePokerCall>;seated:boolean;unavailable:boolean;onPreview:()=>void}){
 const [expanded,setExpanded]=useState(true),self=call.tiles.find(t=>t.self);
 return <div className="poker-video">
  <div className="poker-video-heading"><strong>Conversa da mesa</strong>{call.status==='connected'&&<button aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Recolher câmeras':'Ver câmeras'} · {call.tiles.length}/4</button>}</div>
  {call.status==='idle'?<><p>Jogue e converse. Você escolhe quando ligar a câmera e o microfone.</p><div className="poker-media-controls"><button disabled={!seated||unavailable} onClick={()=>void call.join()}>Conversar com a mesa</button><button onClick={onPreview}>Testar câmera e máscara</button></div>{!seated&&<small>Sente-se para participar da conversa.</small>}{unavailable&&<small>Encerre a outra conversa antes de entrar aqui.</small>}</>:<>
   {call.status==='connecting'?<p role="status">Conectando à conversa…</p>:<>
    {expanded&&<div className="poker-video-grid">{call.tiles.map(t=><div className="poker-video-tile" key={t.id}>{t.video?<Media stream={t.video}/>:<div className="poker-camera-off">Câmera desligada</div>}<span>{t.name}{t.self?' · você':''}</span></div>)}</div>}
    <div className="poker-media-controls"><button aria-pressed={!!self?.video} disabled={call.pending} onClick={()=>void call.toggle('video')}>{self?.video?'Desligar câmera':'Ligar câmera'}</button><button aria-pressed={!!self?.audioOn} disabled={call.pending} onClick={()=>void call.toggle('audio')}>{self?.audioOn?'Desligar microfone':'Ligar microfone'}</button></div>
    <label className="poker-mask-choice"><input type="checkbox" checked={call.masked} onChange={e=>call.changeMask(e.target.checked)}/> Máscara do meu avatar</label>
   </>}
   <button className="poker-call-leave" onClick={()=>void call.leave()}>Sair só da conversa</button>
  </>}
  {call.notice&&<p role="status">{call.notice}</p>}
 </div>;
}
