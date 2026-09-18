import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as T from 'three';
import { ArrowLeft, Armchair, Footprints, Lightbulb, Maximize2, Phone, RotateCcw } from 'lucide-react';
import { createAdultAvatar, animateAdult } from '../garage/adultAvatar';
import { presetAppearance } from '../garage/avatarPresets';
import { buildRoom } from './buildRoom';
import { seatsFor, furniture, barTables, roomNames, approachSeat, seatedOrigin, phones, houseRoute, worldPoint, roomIds, roomOffsets, type Place, type RoomId } from './layout';
import './garage3d.css';

type View='house'|RoomId;
type Controls={focus:(view:View)=>void;view:(close:boolean)=>void;seat:(index:number,room:RoomId)=>void;stand:()=>void;light:(room:RoomId)=>void;phone:(index:number,room:RoomId)=>void;answer:()=>void};
export default function Garage3DPage(){
  const host=useRef<HTMLDivElement>(null),controls=useRef<Controls>();
  const markerRefs=useRef(new Map<number,HTMLButtonElement>());
  const [view,setView]=useState<View>('house');
  const [roomId,setRoomId]=useState<RoomId>('living');
  const seats=seatsFor(roomId);
  const basicMarkers=furniture[roomId].map((f,i)=>({name:f.name,x:f.x+Math.sin(f.angle)*.7,z:f.z+Math.cos(f.angle)*.7,indices:seats.map((s,n)=>s.group===i?n:-1).filter(n=>n>=0)}));
  const pair=roomId==='garage'?[basicMarkers[1],basicMarkers[2]]:[basicMarkers[2],basicMarkers[3]];
  const markers=roomId==='bar'?[{name:'Balcão',x:-1.35,z:-1.1,indices:[0,1,2]},...barTables.map((p,i)=>({...p,z:p.z+1.02,name:`Mesa ${i+1}`,indices:[3+i*4,4+i*4,5+i*4,6+i*4]}))]:[basicMarkers[0],basicMarkers[roomId==='garage'?3:1],{name:'Poltronas',x:(pair[0].x+pair[1].x)/2,z:(pair[0].z+pair[1].z)/2,indices:pair.flatMap(p=>p.indices)}];
  const visibleMarkers=view==='house'?roomIds.map(id=>({...worldPoint({x:0,z:1},id),name:roomNames[id],room:id,indices:[]})):markers.map(m=>({...m,...worldPoint(m,roomId),room:roomId}));
  const projectedMarkers=useRef(visibleMarkers);projectedMarkers.current=visibleMarkers;
  const [close,setClose]=useState(false),[seated,setSeated]=useState(false),[lit,setLit]=useState(true);
  const [status,setStatus]=useState('Toque no piso para passear. Escolha uma poltrona para sentar.');
  const [ring,setRing]=useState<number|null>(null),[error,setError]=useState('');
  const [ready,setReady]=useState(false);
  function focus(next:View){setView(next);setClose(false);if(next!=='house')setRoomId(next);controls.current?.focus(next);}
  useEffect(()=>{
    setReady(false);setSeated(false);setLit(true);setRing(null);setError('');setStatus('Os móveis marcados têm assentos. Toque em “Sentar” ou escolha um lugar na lista.');
    const el=host.current!;let renderer:T.WebGLRenderer;
    try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{setError('Não foi possível abrir o 3D neste aparelho. Você pode entrar na casa atual.');return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    el.appendChild(renderer.domElement);
    const scene=new T.Scene(),camera=new T.OrthographicCamera();
    const cameraFocus=new T.Vector3(-2,.5,-3.5);
    camera.position.copy(cameraFocus).add(new T.Vector3(18,20,24));camera.lookAt(cameraFocus);camera.near=.1;camera.far=100;
    scene.add(new T.HemisphereLight('#fff0d4','#9a8064',2.4));
    const sun=new T.DirectionalLight('#ffdbab',3.2);sun.position.set(-3,9,5);sun.castShadow=true;
    sun.position.set(-8,20,10);sun.target.position.set(0,0,-4);scene.add(sun.target);
    sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.normalBias=.03;sun.shadow.bias=-.0001;scene.add(sun);
    const rooms=Object.fromEntries(roomIds.map(id=>{const room=buildRoom(scene,id,true);room.root.position.set(roomOffsets[id].x,0,roomOffsets[id].z);room.root.userData.roomId=id;return [id,room];})) as Record<RoomId,ReturnType<typeof buildRoom>>;
    const allSeats=Object.fromEntries(roomIds.map(id=>[id,seatsFor(id).map(s=>({...s,...worldPoint(s,id)}))])) as Record<RoomId,ReturnType<typeof seatsFor>>;
    const avatar=createAdultAvatar(0,presetAppearance(0));
    const bounds=new T.Box3().setFromObject(avatar),scale=1.5/(bounds.max.y-bounds.min.y);
    avatar.scale.setScalar(scale);avatar.position.y=-bounds.min.y*scale;
    const hipHeight=avatar.position.y+avatar.getObjectByName('adult-leg-left')!.position.y*scale;
    avatar.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});
    const actor=new T.Group();actor.add(avatar);actor.position.set(-5,0,2.8);scene.add(actor);
    let path:Place[]=[],pendingSeat:{index:number;room:RoomId}|null=null,sitting=false,frame=0,last=performance.now(),zoom=1,targetZoom=1,currentView:View='house';
    const lights:Record<RoomId,boolean>={garage:true,living:true,bar:true};
    let ringing:{index:number;room:RoomId}|null=null,ringUntil=0,active=true;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const raycaster=new T.Raycaster(),pointer=new T.Vector2();let down={x:0,y:0};
    const roomZoom=()=>el.clientWidth<700?1.6:2.05;
    function resize(){const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);const aspect=w/h;const span=Math.max(10,11.2/aspect);if(currentView!=='house'&&targetZoom!==3)targetZoom=roomZoom();
      camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();}
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    function stand(){if(sitting&&pendingSeat){const p=approachSeat(allSeats[pendingSeat.room][pendingSeat.index]);actor.position.set(p.x,0,p.z);}
      sitting=false;pendingSeat=null;setSeated(false);path=[];}
    function sit(index:number,id:RoomId){stand();const s=allSeats[id][index];if(!s)return;const goal=approachSeat(s);
      path=houseRoute(actor.position,goal);if(!path.length){setStatus('Escolha um lugar com passagem livre.');return;}pendingSeat={index,room:id};setRoomId(id);setLit(lights[id]);if(currentView!=='house'){currentView=id;setView(id);}setStatus(`Indo até ${s.name.toLowerCase()} em ${roomNames[id]}…`);}
    function phone(index:number,id:RoomId){ringing={index,room:id};ringUntil=performance.now()+6000;setRing(index);setStatus(`O telefone em ${roomNames[id]} está tocando. Toque nele para atender o teste.`);}
    function answer(){ringing=null;setRing(null);setStatus('Alô! Teste atendido. As ligações reais continuam na casa atual.');}
    controls.current={focus:v=>{currentView=v;targetZoom=v==='house'?1:roomZoom();if(v!=='house')setLit(lights[v]);},view:v=>{targetZoom=v?3:currentView==='house'?1:roomZoom();},seat:sit,stand,light:id=>{lights[id]=!lights[id];rooms[id].lights(lights[id]);setLit(lights[id]);},phone,answer};
    function onDown(e:PointerEvent){down={x:e.clientX,y:e.clientY};}
    function onUp(e:PointerEvent){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)return;
      const rect=el.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
      const hits=raycaster.intersectObjects(roomIds.map(id=>rooms[id].root),true);
      for(const hit of hits){let root:T.Object3D=hit.object;while(root.parent&&!root.userData.roomId)root=root.parent;const id=root.userData.roomId as RoomId;if(!id)return;
        const seats=allSeats[id];let o:T.Object3D|null=hit.object;while(o&&o!==root){
        if(o.userData.kind==='seat'){const nearest=(o.userData.indices as number[]).reduce((a,b)=>Math.hypot(seats[a].x-hit.point.x,seats[a].z-hit.point.z)<Math.hypot(seats[b].x-hit.point.x,seats[b].z-hit.point.z)?a:b);sit(nearest,id);return;}
        if(o.userData.kind==='phone'){const index=o.userData.index as number;if(ringing?.index===index&&ringing.room===id)answer();else phone(index,id);return;}o=o.parent;}
        if(hit.object===rooms[id].floor||hit.point.y<.065){stand();path=houseRoute(actor.position,hit.point);setStatus(path.length?'Passeando pela casa…':'Esse lugar está ocupado por um móvel. Toque no piso livre.');return;}
        // Walls and furniture occlude the floor; do not walk through them.
        return;
      }
    }
    el.addEventListener('pointerdown',onDown);el.addEventListener('pointerup',onUp);
    function tick(now:number){if(!active)return;const dt=Math.min((now-last)/1000,.05);last=now;let moving=false;
      if(path.length){const p=path[0],dx=p.x-actor.position.x,dz=p.z-actor.position.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*1.7);
        actor.position.x+=dx/(d||1)*step;actor.position.z+=dz/(d||1)*step;actor.rotation.y=Math.atan2(dx,dz);moving=d>.01;if(d<.04)path.shift();
        if(!path.length){if(pendingSeat!==null){const s=allSeats[pendingSeat.room][pendingSeat.index];actor.position.set(s.x+Math.sin(s.angle)*.18,seatedOrigin(s.height,hipHeight),s.z+Math.cos(s.angle)*.18);actor.rotation.y=s.angle;sitting=true;setSeated(true);setStatus(`Sentado em ${s.name.toLowerCase()}. Use “Levantar” para continuar.`);}else setStatus('Escolha um móvel ou toque no piso para continuar.');}}
      animateAdult(avatar,moving&&!reduced,now/1000,sitting,dt);
      zoom+=(targetZoom-zoom)*(reduced?1:Math.min(1,dt*5));camera.zoom=zoom;
      const focus=targetZoom===3?new T.Vector3(actor.position.x,.65,actor.position.z):currentView==='house'?new T.Vector3(-2,.5,-3.5):new T.Vector3(roomOffsets[currentView].x,.5,roomOffsets[currentView].z);
      cameraFocus.lerp(focus,reduced?1:Math.min(1,dt*4));camera.position.copy(cameraFocus).add(new T.Vector3(18,20,24));camera.lookAt(cameraFocus);camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      projectedMarkers.current.forEach((m,i)=>{const button=markerRefs.current.get(i);if(!button)return;const p=new T.Vector3(m.x,.13,m.z).project(camera);button.style.left=`${(p.x+1)*50}%`;button.style.top=`${(1-p.y)*50}%`;button.hidden=p.x<-.9||p.x>.9||p.y<-.85||p.y>.85;});
      roomIds.forEach(id=>{const room=rooms[id];if(!reduced)room.disco.rotation.y=now*.00012;
      room.phones.forEach((p,i)=>{p.rotation.z=ringing?.index===i&&ringing.room===id&&!reduced?Math.sin(now*.04)*.10:0;});});
      if(ringing!==null&&now>ringUntil){ringing=null;setRing(null);setStatus('O telefone parou de tocar. Você pode testar novamente.');}
      renderer.render(scene,camera);el.dataset.drawCalls=String(renderer.info.render.calls);el.dataset.triangles=String(renderer.info.render.triangles);
      el.dataset.position=`${actor.position.x.toFixed(2)},${actor.position.z.toFixed(2)}`;
      el.dataset.seated=String(sitting);el.dataset.hipHeight=(actor.position.y+hipHeight).toFixed(3);el.dataset.seatHeight=pendingSeat!==null?String(allSeats[pendingSeat.room][pendingSeat.index].height):'';el.dataset.view=currentView;
      frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);setReady(true);
    return()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();controls.current=undefined;el.removeEventListener('pointerdown',onDown);el.removeEventListener('pointerup',onUp);roomIds.forEach(id=>rooms[id].dispose());sun.shadow.map?.dispose();
      const geometry=new Set<T.BufferGeometry>(),material=new Set<T.Material>();avatar.traverse(o=>{if(o instanceof T.Mesh){geometry.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>material.add(m));}});geometry.forEach(g=>g.dispose());material.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <main className="garage3d-page">
    <header><Link to="/garagem"><ArrowLeft size={17}/> Voltar à casa</Link><span>DISQUE AMIZADE <i>/</i> ESTUDO 3D</span><span className="garage3d-version">{view==='house'?'Casa inteira · 31 lugares':`${roomNames[roomId]} · ${seats.length} lugares`}</span></header>
    <section className="garage3d-intro"><div><p>A MESMA CASA. UMA NOVA DIMENSÃO.</p><h1>Entre. Fique à vontade.</h1></div><p>Um cantinho para ouvir música,<br/>puxar uma cadeira e encontrar sua turma.</p></section>
    <nav className="garage3d-rooms" aria-label="Ambientes 3D"><button aria-pressed={view==='house'} onClick={()=>focus('house')}>Casa inteira<small>3 ambientes conectados</small></button>{roomIds.map(id=><button key={id} aria-pressed={view===id} onClick={()=>focus(id)}>{roomNames[id]}<small>{seatsFor(id).length} lugares{id==='bar'?' · 18+':''}</small></button>)}</nav>
    <section className="garage3d-stage" aria-label="Casa tridimensional integrada">
      <div ref={host} className="garage3d-canvas" aria-label="Toque no chão para caminhar e nos móveis para interagir"/>
      {!ready&&!error&&<div className="garage3d-loading">Preparando a casa…</div>}
      {error&&<p className="garage3d-loading">{error} <Link to="/garagem">Entrar na casa</Link></p>}
      {ready&&visibleMarkers.map((m,i)=><button key={`${view}-${i}`} ref={el=>{if(el)markerRefs.current.set(i,el);else markerRefs.current.delete(i);}} className={`garage3d-seat-marker ${view==='house'?'garage3d-room-marker':''}`} onClick={()=>view==='house'?focus(m.room):controls.current?.seat(m.indices[0],m.room)} aria-label={view==='house'?`Explorar ${m.name}`:`Sentar: ${m.name}`}><Armchair size={14}/><span>{m.name}<small>{view==='house'?'Aproximar →':`${m.indices.length} lugares · Sentar`}</small></span></button>)}
      <div className="garage3d-camera"><button disabled={!ready} onClick={()=>{setClose(!close);controls.current?.view(!close);}}><Maximize2 size={16}/>{close?'Ver ambiente inteiro':'Chegar mais perto'}</button><button aria-label="Restaurar câmera" onClick={()=>{setClose(false);controls.current?.view(false);}}><RotateCcw size={16}/></button></div>
      <div className="garage3d-caption"><span>{view==='house'?'UMA CASA / 3 AMBIENTES / 31 LUGARES':`${roomNames[roomId].toUpperCase()} / ${seats.length} LUGARES PARA SENTAR`}</span><p>{view==='house'?'Escolha um cantinho. A casa é toda sua.':'Toque no piso para andar. Nos móveis, para sentar.'}</p></div>
    </section>
    <section className="garage3d-tools" aria-label="Interações da garagem">
      <p className="garage3d-tools-room">Interações · {roomNames[roomId]}</p>
      <div className="garage3d-actions"><button disabled={!ready} onClick={()=>controls.current?.light(roomId)}><Lightbulb size={18}/>{lit?'Apagar luzes':'Acender luzes'}</button>
      <button disabled={!ready} onClick={()=>{if(seated)controls.current?.stand();else controls.current?.seat(0,roomId);}}>{seated?<Footprints size={18}/>:<Armchair size={18}/>} {seated?'Levantar':roomId==='bar'?'Sentar no balcão':'Sentar no sofá'}</button>
      <button disabled={!ready} onClick={()=>ring!==null?controls.current?.answer():controls.current?.phone(Math.floor(Math.random()*phones.length),roomId)}><Phone size={18}/>{ring!==null?'Atender telefone':'Testar telefone'}</button>
      <select aria-label="Escolher assento" disabled={!ready} defaultValue="" onChange={e=>{controls.current?.seat(Number(e.target.value),roomId);e.target.value='';}}><option value="" disabled>Escolher um lugar</option>{seats.map((s,i)=><option key={s.name} value={i}>{s.name}</option>)}</select></div>
      <p role="status">{status}</p>
    </section>
    <footer><span>Prévia para avaliar o espaço e as interações. Sem outras pessoas ou chamadas reais nesta versão.</span><Link to="/garagem">Ir para a casa atual →</Link></footer>
  </main>;
}
