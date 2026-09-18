import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as T from 'three';
import { ArrowLeft, Armchair, Footprints, Lightbulb, Maximize2, Phone, RotateCcw } from 'lucide-react';
import { createAdultAvatar, animateAdult } from '../garage/adultAvatar';
import { presetAppearance } from '../garage/avatarPresets';
import { buildRoom } from './buildRoom';
import { seats, phones, route, type Place } from './layout';
import './garage3d.css';

type Controls={view:(close:boolean)=>void;seat:(index:number)=>void;stand:()=>void;light:()=>void;phone:(index:number)=>void;answer:()=>void};
export default function Garage3DPage(){
  const host=useRef<HTMLDivElement>(null),controls=useRef<Controls>();
  const [close,setClose]=useState(false),[seated,setSeated]=useState(false),[lit,setLit]=useState(true);
  const [status,setStatus]=useState('Toque no piso para passear. Escolha uma poltrona para sentar.');
  const [ring,setRing]=useState<number|null>(null),[error,setError]=useState('');
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    const el=host.current!;let renderer:T.WebGLRenderer;
    try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{setError('Não foi possível abrir o 3D neste aparelho. Você pode entrar na casa atual.');return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    el.appendChild(renderer.domElement);
    const scene=new T.Scene(),camera=new T.OrthographicCamera();
    camera.position.set(11,11.5,14);camera.lookAt(0,.5,0);camera.near=.1;camera.far=70;
    scene.add(new T.HemisphereLight('#fff0d4','#9a8064',2.4));
    const sun=new T.DirectionalLight('#ffdbab',3.2);sun.position.set(-3,9,5);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-8;sun.shadow.camera.right=8;sun.shadow.camera.top=8;sun.shadow.camera.bottom=-8;sun.shadow.normalBias=.03;sun.shadow.bias=-.0001;scene.add(sun);
    const room=buildRoom(scene);
    const avatar=createAdultAvatar(0,presetAppearance(0));
    const bounds=new T.Box3().setFromObject(avatar),scale=1.5/(bounds.max.y-bounds.min.y);
    avatar.scale.setScalar(scale);avatar.position.y=-bounds.min.y*scale;
    avatar.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});
    const actor=new T.Group();actor.add(avatar);actor.position.set(0,0,2.8);scene.add(actor);
    let path:Place[]=[],pendingSeat:number|null=null,sitting=false,frame=0,last=performance.now(),zoom=1,targetZoom=1,lights=true;
    let ringing:number|null=null,ringUntil=0,active=true;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const raycaster=new T.Raycaster(),pointer=new T.Vector2();let down={x:0,y:0};
    function resize(){const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);const aspect=w/h;const span=aspect<1?6.8/aspect:5.8;
      camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();}
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    function stand(){if(sitting){const s=seats[pendingSeat??0];actor.position.set(s.x+Math.sin(s.angle)*.95,0,s.z);}
      sitting=false;pendingSeat=null;setSeated(false);path=[];}
    function sit(index:number){stand();const s=seats[index];const goal={x:s.x+Math.sin(s.angle)*.95,z:s.z};
      path=route(actor.position,goal);if(!path.length){setStatus('Escolha um lugar com passagem livre.');return;}pendingSeat=index;setStatus(`Indo até ${s.name.toLowerCase()}…`);}
    function phone(index:number){ringing=index;ringUntil=performance.now()+6000;setRing(index);setStatus('O telefone está tocando. Toque nele para atender o teste.');}
    function answer(){ringing=null;setRing(null);setStatus('Alô! Teste atendido. As ligações reais continuam na casa atual.');}
    controls.current={view:v=>{targetZoom=v?1.5:1;},seat:sit,stand,light:()=>{lights=!lights;room.lights(lights);sun.intensity=lights?3.2:1.2;setLit(lights);},phone,answer};
    function onDown(e:PointerEvent){down={x:e.clientX,y:e.clientY};}
    function onUp(e:PointerEvent){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)return;
      const rect=el.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
      const hits=raycaster.intersectObjects(room.root.children,true);
      for(const hit of hits){let o:T.Object3D|null=hit.object;while(o&&o!==room.root){
        if(o.userData.kind==='seat'){sit(o.userData.index===0&&hit.point.z>1.1?1:o.userData.index);return;}
        if(o.userData.kind==='phone'){const index=o.userData.index as number;if(ringing===index)answer();else phone(index);return;}o=o.parent;}
        if(hit.object===room.floor||hit.point.y<.065){stand();path=route(actor.position,hit.point);setStatus(path.length?'Passeando pela garagem…':'Esse lugar está ocupado por um móvel. Toque no piso livre.');return;}
        // Walls and furniture occlude the floor; do not walk through them.
        return;
      }
    }
    el.addEventListener('pointerdown',onDown);el.addEventListener('pointerup',onUp);
    function tick(now:number){if(!active)return;const dt=Math.min((now-last)/1000,.05);last=now;let moving=false;
      if(path.length){const p=path[0],dx=p.x-actor.position.x,dz=p.z-actor.position.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*1.7);
        actor.position.x+=dx/(d||1)*step;actor.position.z+=dz/(d||1)*step;actor.rotation.y=Math.atan2(dx,dz);moving=d>.01;if(d<.04)path.shift();
        if(!path.length){if(pendingSeat!==null){const s=seats[pendingSeat];actor.position.set(s.x,.58-.79*scale,s.z);actor.rotation.y=s.angle;sitting=true;setSeated(true);setStatus('À vontade. Use “Levantar” para continuar explorando.');}else setStatus('Escolha um móvel ou toque no piso para continuar.');}}
      animateAdult(avatar,moving&&!reduced,now/1000,sitting,dt);
      zoom+=(targetZoom-zoom)*(reduced?1:Math.min(1,dt*5));camera.zoom=zoom;
      const focus=targetZoom>1?new T.Vector3(actor.position.x,.65,actor.position.z):new T.Vector3(0,.5,0);
      camera.position.lerp(focus.clone().add(new T.Vector3(11,11.5,14)),reduced?1:Math.min(1,dt*4));camera.lookAt(focus);camera.updateProjectionMatrix();
      if(!reduced)room.disco.rotation.y=now*.00012;
      room.phones.forEach((p,i)=>{p.rotation.z=ringing===i&&!reduced?Math.sin(now*.04)*.10:0;});
      if(ringing!==null&&now>ringUntil){ringing=null;setRing(null);setStatus('O telefone parou de tocar. Você pode testar novamente.');}
      renderer.render(scene,camera);el.dataset.drawCalls=String(renderer.info.render.calls);el.dataset.triangles=String(renderer.info.render.triangles);
      el.dataset.position=`${actor.position.x.toFixed(2)},${actor.position.z.toFixed(2)}`;
      frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);setReady(true);
    return()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();controls.current=undefined;el.removeEventListener('pointerdown',onDown);el.removeEventListener('pointerup',onUp);room.dispose();
      const geometry=new Set<T.BufferGeometry>(),material=new Set<T.Material>();avatar.traverse(o=>{if(o instanceof T.Mesh){geometry.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>material.add(m));}});geometry.forEach(g=>g.dispose());material.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <main className="garage3d-page">
    <header><Link to="/garagem"><ArrowLeft size={17}/> Voltar à casa</Link><span>DISQUE AMIZADE <i>/</i> ESTUDO 3D</span><span className="garage3d-version">Garagem · 01</span></header>
    <section className="garage3d-intro"><div><p>A MESMA CASA. UMA NOVA DIMENSÃO.</p><h1>Entre. Fique à vontade.</h1></div><p>Um cantinho para ouvir música,<br/>puxar uma cadeira e encontrar sua turma.</p></section>
    <section className="garage3d-stage" aria-label="Garagem tridimensional interativa">
      <div ref={host} className="garage3d-canvas" aria-label="Toque no chão para caminhar e nos móveis para interagir"/>
      {!ready&&!error&&<div className="garage3d-loading">Preparando a casa…</div>}
      {error&&<p className="garage3d-loading">{error} <Link to="/garagem">Entrar na casa</Link></p>}
      <div className="garage3d-camera"><button disabled={!ready} onClick={()=>{setClose(!close);controls.current?.view(!close);}}><Maximize2 size={16}/>{close?'Ver garagem inteira':'Chegar mais perto'}</button><button aria-label="Restaurar câmera" onClick={()=>{setClose(false);controls.current?.view(false);}}><RotateCcw size={16}/></button></div>
      <div className="garage3d-caption"><span>GARAGEM / LADO A</span><p>Luz quente. Disco bom. Gente por perto.</p></div>
    </section>
    <section className="garage3d-tools" aria-label="Interações da garagem">
      <div className="garage3d-actions"><button disabled={!ready} onClick={()=>controls.current?.light()}><Lightbulb size={18}/>{lit?'Apagar luzes':'Acender luzes'}</button>
      <button disabled={!ready} onClick={()=>{if(seated)controls.current?.stand();else controls.current?.seat(0);}}>{seated?<Footprints size={18}/>:<Armchair size={18}/>} {seated?'Levantar':'Sentar no sofá'}</button>
      <button disabled={!ready} onClick={()=>ring!==null?controls.current?.answer():controls.current?.phone(Math.floor(Math.random()*phones.length))}><Phone size={18}/>{ring!==null?'Atender telefone':'Testar telefone'}</button>
      <select aria-label="Escolher assento" disabled={!ready} defaultValue="" onChange={e=>{controls.current?.seat(Number(e.target.value));e.target.value='';}}><option value="" disabled>Escolher um lugar</option>{seats.map((s,i)=><option key={s.name} value={i}>{s.name}</option>)}</select></div>
      <p role="status">{status}</p>
    </section>
    <footer><span>Prévia para avaliar o espaço e as interações. Sem outras pessoas ou chamadas reais nesta versão.</span><Link to="/garagem">Ir para a casa atual →</Link></footer>
  </main>;
}
