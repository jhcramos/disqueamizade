import type {Point} from './pose';
export type CaptureStatus={phase:'off'|'loading'|'active'|'error';message:string;ms?:number;hz?:number};
/** Owns only its private stream. Stop is safe during permission/model/frame awaits. */
export function createPoseCapture(video:HTMLVideoElement,onPose:(p:Point[],world?:Point[])=>void,onStatus:(s:CaptureStatus)=>void){
 let stopped=false,stream:MediaStream|undefined,worker:Worker|undefined,timer:ReturnType<typeof setTimeout>|undefined,watchdog:ReturnType<typeof setTimeout>|undefined;
 let hz=12,slow=0,frames=0,average=0,raf=0,renderFrames=0,renderStart=0,poorWindows=0;
 function stop(message='Câmera de movimentos desligada.',error=false){
  if(stopped)return;stopped=true;clearTimeout(timer);clearTimeout(watchdog);cancelAnimationFrame(raf);worker?.terminate();
  stream?.getTracks().forEach(t=>t.stop());video.pause();video.srcObject=null;onPose([]);onStatus({phase:error?'error':'off',message});
 }
 const fail=(message:string)=>stop(message,true);
 function monitor(now:number){
  if(stopped)return;renderFrames++;
  if(now-renderStart>=2000){
   const fps=renderFrames*1000/(now-renderStart);renderFrames=0;renderStart=now;
   if(fps<24)hz=6;poorWindows=fps<15?poorWindows+1:0;
   if(poorWindows>=3){fail('O teste foi desligado para manter a casa fluida.');return;}
  }
  raf=requestAnimationFrame(monitor);
 }
 async function frame(){
  if(stopped)return;
  if(video.readyState<2){timer=setTimeout(()=>void frame(),100);return;}
  try{
   const bitmap=await createImageBitmap(video,{resizeWidth:320,resizeHeight:240});
   if(stopped){bitmap.close();return;}
   watchdog=setTimeout(()=>fail('O teste ficou lento e foi desligado. As animações normais continuam.'),5000);
   worker!.postMessage({type:'frame',bitmap,ts:performance.now()},[bitmap]);
  }catch{fail('Não foi possível ler a câmera. O teste foi desligado.');}
 }
 async function start(){
  if(!navigator.mediaDevices?.getUserMedia||!globalThis.Worker||!globalThis.OffscreenCanvas||!globalThis.createImageBitmap){fail('Este navegador não suporta o teste leve. As animações normais continuam.');return;}
  onStatus({phase:'loading',message:'Aguardando câmera e preparando movimentos…'});
  watchdog=setTimeout(()=>fail('O carregamento demorou demais. Tente novamente com uma conexão melhor.'),45000);
  try{
   const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:320},height:{ideal:240},frameRate:{ideal:15,max:15}},audio:false});
   if(stopped){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;
   stream.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>stop()));
   video.srcObject=stream;await video.play();if(stopped)return;
   worker=new Worker('/avatar-pose-worker.js');
   worker.onerror=()=>fail('Não foi possível iniciar o reconhecimento neste navegador.');
   worker.onmessage=({data})=>{
    if(stopped)return;
    if(data.type==='error'){fail('O reconhecimento não pôde continuar. Câmera desligada.');return;}
    clearTimeout(watchdog);
    if(data.type==='ready'){renderStart=performance.now();raf=requestAnimationFrame(monitor);onStatus({phase:'active',message:'Mostre ombros, cotovelos e mãos. A imagem fica neste aparelho.',hz});void frame();}
    if(data.type==='pose'){
     frames++;average=frames===1?data.ms:average*.8+data.ms*.2;
     if(frames>8){if(average>75)hz=6;slow=average>200?slow+1:0;}
     if(slow>=12){fail('Este aparelho ficou sobrecarregado. O teste foi desligado automaticamente.');return;}
     onPose(data.points,data.world);onStatus({phase:'active',message:data.points.length?'Movimentos detectados':'Enquadre os braços para o avatar acompanhar.',ms:Math.round(average),hz});
     // Leave processing headroom for the house even when inference is slow.
     timer=setTimeout(()=>void frame(),Math.max(data.ms*.75,1000/hz-data.ms));
    }
   };
   worker.postMessage({type:'init'});
  }catch{if(!stopped)fail('Não foi possível abrir a câmera. Verifique a permissão e tente novamente.');}
 }
 return {start,stop};
}
