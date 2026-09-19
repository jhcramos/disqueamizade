import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import type {BodyPose} from './pose';
import {mapPose} from './pose';
import type {CaptureStatus,createPoseCapture} from './capture';
export type MotionFrame={pose:BodyPose;at:number};
export function MotionExperiment({frame,blocked,onFocus}:{frame:MutableRefObject<MotionFrame|null>;blocked:boolean;onFocus:()=>void}){
 const [open,setOpen]=useState(false),[status,setStatus]=useState<CaptureStatus>({phase:'off',message:''});
 const video=useRef<HTMLVideoElement>(null),capture=useRef<ReturnType<typeof createPoseCapture>>(),generation=useRef(0);
 const active=status.phase==='loading'||status.phase==='active';
 function stop(){generation.current++;capture.current?.stop();capture.current=undefined;frame.current=null;setStatus({phase:'off',message:'Câmera de movimentos desligada.'});}
 useEffect(()=>{if(blocked){stop();setOpen(false);}},[blocked]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>{stop();document.removeEventListener('visibilitychange',hide);};},[]);
 async function start(){
  const token=++generation.current;setStatus({phase:'loading',message:'Preparando teste…'});
  try{const {createPoseCapture}=await import('./capture');if(token!==generation.current||!video.current)return;
   capture.current=createPoseCapture(video.current,p=>{frame.current={pose:mapPose(p),at:performance.now()};},s=>{if(s.phase==='off'||s.phase==='error')frame.current=null;setStatus(s);});
   onFocus();void capture.current.start();
  }catch{setStatus({phase:'error',message:'Não foi possível carregar o teste. Tente novamente.'});}
 }
 return <div className="motion-experiment">
  <button disabled={blocked} aria-expanded={open} onClick={()=>{if(open)stop();setOpen(!open);}}> {active?'● Câmera de movimentos ligada':'Movimentar avatar · teste'}</button>
  {open&&<section className="motion-panel" aria-label="Teste de movimento do avatar">
   <div><strong>Seu gesto, seu avatar</strong><p>Prévia local de braços e tronco. Sua imagem e seus movimentos não são enviados aos outros. Pare de andar para experimentar.</p>
   <p role="status">{status.message}{status.ms!==undefined&&` · ${status.ms} ms / leitura · até ${status.hz} por segundo`}</p>
   {active?<button onClick={stop}>Parar e desligar câmera</button>:<button disabled={blocked} onClick={()=>void start()}>Ativar câmera só para movimentos</button>}
   <button onClick={()=>{stop();setOpen(false);}}>Fechar</button></div>
   <video ref={video} muted playsInline aria-label="Prévia privada da câmera de movimentos" style={{display:active?'block':'none'}}/>
  </section>}
 </div>;
}
