import {installAvatarNodeMaterials,applyAvatarMaterials,avatarTslEnabled} from './avatarFinish';
import {HOUSE_AREAS,areaAt,areaById,type AreaId} from './areas';
import {useSharedMotion} from './motion/useSharedMotion';
import {MotionExperiment,type MotionFrame} from './motion/MotionExperiment';
import {neutralPose,smoothPose} from './motion/pose';
import {applyBodyPose} from './motion/rig';
import {createCameraGestures} from './cameraGestures';
import {createHostProximity,type NearbyHost} from './residents/proximity';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as T from 'three';
import { ArrowLeft, Armchair, Footprints, Lightbulb, Maximize2, Phone, RotateCcw, Eye, Music2, Sparkles, ArrowUp, ArrowDown, ArrowRight, MessageCircle, Video, Tv } from 'lucide-react';
import { createAdultAvatar, animateAdult } from '../garage/adultAvatar';
import { presetAppearance } from '../garage/avatarPresets';
import { buildRoom } from './buildRoom';
import { seatsFor, furniture, barTables, roomNames, approachSeat, seatedOrigin, houseRoute, worldPoint, roomIds, roomOffsets, roomAt, nearbyPhone, routeToPhone, moveInHouse, type HousePhone, type Place, type RoomId } from './layout';
import { createHouseMusic } from './houseMusic';
import type { LiveHouseSession } from './liveHouse';
import { toWorld, toShared } from './coordinates';
import { seatsForRoom } from '../garage/seats';
import { appearanceKey, INTENTIONS } from '../garage/avatarStyle';
import { createRemoteActors, disposeAvatar } from './remoteActors';
import { createPlayObjects } from './playObjects';
import { HouseTray } from '../garage/MobileHouseViewport';
import { createResidentVisuals, addResidentFixtures } from './residents/visuals';
import { createLife, targetPosition, approach, ITEMS, NAMES, heldItem, type LifeAction } from './residents/model';
import { createResidentTransport, type Connection } from './residents/transport';
import { ResidentPanel } from './residents/ResidentPanel';
import {HOST_ACTIONS} from './residents/social';
import {PokerPanel} from './poker/PokerPanel';
import type {Visitor} from './residents/model';
import './garage3d.css';

type View='house'|RoomId;
type Controls={area:(id:AreaId)=>void;enteredRoom:(room:RoomId)=>void;focus:(view:View)=>void;view:(close:boolean)=>void;seat:(index:number,room:RoomId)=>void;stand:()=>void;light:(room:RoomId)=>void;phone:()=>void;approachPhone:(room:RoomId)=>void;answer:()=>void;firstPerson:(enabled:boolean)=>void;lookInside:()=>void;move:(key:string,pressed:boolean)=>void;dance:()=>void};
const questions=['Qual música faz você levantar para dançar?','Que lugar da sua cidade você mostraria a alguém daqui?','Qual foi a melhor amizade que começou por acaso?','Que pequeno talento seu merece uma plateia?','Se esta casa tivesse uma festa temática, qual seria?','Qual filme você reassistiria com uma pessoa nova?'];
export default function Garage3DPage({session}:{session?:LiveHouseSession}={}){
  const [life,setLife]=useState(()=>createLife()),[lifeMode,setLifeMode]=useState<Connection>('connecting'),[residentTarget,setResidentTarget]=useState<string|null>(null),[lifeMessage,setLifeMessage]=useState(''),[quietResidents,setQuietResidents]=useState(false);
  const residentLabels=useRef(new Map<string,HTMLButtonElement>()),residentAction=useRef<(action:LifeAction,target:string,request?:string)=>void>();
  const motionFrame=useRef<MotionFrame|null>(null);
  const sharedMotion=useSharedMotion(session?.self.room??'garage',session?.self.id,!!session&&import.meta.env.VITE_ENABLE_AVATAR_MOTION!=='false'&&import.meta.env.VITE_ENABLE_AVATAR_MOTION_SHARING!=='false');
  const motionShare=useRef(sharedMotion);motionShare.current=sharedMotion;
  const [pokerOpen,setPokerOpen]=useState(false);
  const [nearHost,setNearHost]=useState<NearbyHost|null>(null),dismissNearby=useRef<(host?:NearbyHost)=>void>();
  const interactionUI=useRef({residentTarget,pokerOpen,quietResidents});interactionUI.current={residentTarget,pokerOpen,quietResidents};
  const meetResident=useRef<(id:string)=>void>();
  const pokerSeat=useRef<number|null>(null);
  const pokerVisitor=useRef<()=>Visitor>(()=>({id:previewVisitor.current,name:'Visitante',position:{x:7,z:6.8}}));
  const previewVisitor=useRef(crypto.randomUUID());
  const live=useRef(session);live.current=session;
  const personLabels=useRef(new Map<string,HTMLButtonElement>()),inviteLabel=useRef<HTMLDivElement>(null);
  const tvSlot=useRef<HTMLDivElement|null>(null);
  const attachTV=useCallback((node:HTMLDivElement|null)=>{tvSlot.current=node;live.current?.onTVSurface?.(node);},[]);
  const host=useRef<HTMLDivElement>(null),controls=useRef<Controls>();
  const markerRefs=useRef(new Map<number,HTMLButtonElement>());
  const [view,setView]=useState<View>(session?.self.room??'house');
  const [activeArea,setActiveArea]=useState<AreaId>(session?.self.room==='bar'?'dining':session?.self.room??'living');
  const [roomId,setRoomId]=useState<RoomId>(session?.self.room??'living');
  const seats=seatsFor(roomId);
  const markers=roomId==='bar'?[{name:'Balcão da cozinha',x:-2.25,z:-1.25,indices:[0,1,2]},...barTables.map((p,i)=>({...p,z:p.z+1.02,name:i===1?'Pôquer · fichas grátis':i===0?'Mesa de jogos':'Café e histórias',indices:[3+i*4,4+i*4,5+i*4,6+i*4]}))]:furniture[roomId].map((f,i)=>({name:f.name,x:f.x+Math.sin(f.angle)*.7,z:f.z+Math.cos(f.angle)*.7,indices:seats.map((s,n)=>s.group===i?n:-1).filter(n=>n>=0)}));
  const visibleMarkers=view==='house'?HOUSE_AREAS.filter(a=>['living','dining','garage','alfresco','pool','media'].includes(a.id)).map(a=>({x:a.arrival.x,z:a.arrival.z,name:a.name,room:a.room,area:a.id,indices:[] as number[]})):markers.map(m=>({...m,...worldPoint(m,roomId),room:roomId,area:undefined as AreaId|undefined}));
  const projectedMarkers=useRef(visibleMarkers);projectedMarkers.current=visibleMarkers;
  const [close,setClose]=useState(!!session),[seated,setSeated]=useState(false),[lit,setLit]=useState(true);
  const [status,setStatus]=useState('Toque no piso para passear. Escolha uma poltrona para sentar.');
  const [ring,setRing]=useState<number|null>(null),[error,setError]=useState('');
  const [ready,setReady]=useState(false);
  const [firstPerson,setFirstPerson]=useState(false),[nearPhone,setNearPhone]=useState<HousePhone|null>(null),[dancing,setDancing]=useState(false);
  const [musicOn,setMusicOn]=useState(false),[question,setQuestion]=useState(-1);
  const music=useRef<ReturnType<typeof createHouseMusic>>();
  async function toggleMusic(){if(musicOn){music.current?.stop();setMusicOn(false);return;}try{music.current??=createHouseMusic();await music.current.start();setMusicOn(true);}catch{setStatus('Não foi possível ligar o som neste navegador.');}}
  function focus(next:View){if(session?.frozen)return;if(session&&next!=='house'&&next!==session.self.room&&!session.onRoom(next))return;setView(next);setClose(false);setFirstPerson(false);if(next!=='house')setRoomId(next);controls.current?.focus(next);}
  useEffect(()=>{if(session?.self.room){setRoomId(session.self.room);setView(session.self.room);setClose(true);controls.current?.enteredRoom(session.self.room);}},[session?.self.room]);
  useEffect(()=>{if(session?.frozen){music.current?.stop();setMusicOn(false);}},[session?.frozen]);
  useEffect(()=>{
    setReady(false);setSeated(false);setLit(true);setRing(null);setError('');setStatus('Os móveis marcados têm assentos. Toque em “Sentar” ou escolha um lugar na lista.');
    const el=host.current!;let renderer:T.WebGLRenderer;
    try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{setError('Este aparelho não conseguiu abrir a casa 3D. O chat e a lista de pessoas continuam disponíveis.');return;}
    const avatarMaterials=installAvatarNodeMaterials(renderer);
    renderer.setPixelRatio(Math.min(devicePixelRatio,live.current?.low?1:1.5));renderer.shadowMap.enabled=!live.current?.low;renderer.shadowMap.type=T.PCFShadowMap;
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    el.appendChild(renderer.domElement);
    const scene=new T.Scene(),camera=new T.OrthographicCamera(),cinemaCamera=new T.OrthographicCamera(-1,1,1,-1,.01,15),eyeCamera=new T.PerspectiveCamera(65,1,.05,80);
    scene.background=new T.Color('#f4ede0');
    const initial=live.current?toWorld(live.current.self.position,live.current.self.room??'garage'):{x:-2,z:-3.5};
    const cameraFocus=new T.Vector3(initial.x,.65,initial.z);let manualFocus:T.Vector3|null=null;
    camera.position.copy(cameraFocus).add(new T.Vector3(18,25,26));camera.lookAt(cameraFocus);camera.near=.1;camera.far=100;
    scene.add(new T.HemisphereLight('#fff0d4','#9a8064',2.4));
    const sun=new T.DirectionalLight('#ffdbab',3.2);sun.position.set(-3,9,5);sun.castShadow=true;
    sun.position.set(-8,20,10);sun.target.position.set(0,0,-4);scene.add(sun.target);
    sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.normalBias=.03;sun.shadow.bias=-.0001;scene.add(sun);
    const rooms=Object.fromEntries(roomIds.map(id=>{const room=buildRoom(scene,id,true);room.root.position.set(roomOffsets[id].x,0,roomOffsets[id].z);room.root.userData.roomId=id;return [id,room];})) as Record<RoomId,ReturnType<typeof buildRoom>>;
    const allSeats=Object.fromEntries(roomIds.map(id=>[id,seatsFor(id).map(s=>({...s,...worldPoint(s,id)}))])) as Record<RoomId,ReturnType<typeof seatsFor>>;
    let avatar=createAdultAvatar(live.current?.self.avatar??0,live.current?.self.appearance??presetAppearance(0));applyAvatarMaterials(avatar,live.current?.self.appearance??presetAppearance(0),live.current?.self.avatar??0,avatarMaterials);
    const bounds=new T.Box3().setFromObject(avatar),scale=1.5/(bounds.max.y-bounds.min.y);
    avatar.scale.setScalar(scale);avatar.position.y=-bounds.min.y*scale;
    let hipHeight=avatar.position.y+avatar.getObjectByName('adult-leg-left')!.position.y*scale;
    avatar.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});
    const actor=new T.Group();actor.add(avatar);actor.position.set(7,0,6.8);scene.add(actor);
    let avatarBaseY=avatar.position.y;
    const motionPose=neutralPose();let motionUsed=false;
    const remote=createRemoteActors(scene,avatarMaterials),playObjects=createPlayObjects(scene);
    const residentVisuals=createResidentVisuals(scene,avatarMaterials),residentFixtures=addResidentFixtures(scene);
    let gestureUntil=0,pendingResident:{action:LifeAction;target:string;started:number}|null=null;
    const lifeTransport=createResidentTransport(()=>({id:live.current?.self.id??previewVisitor.current,name:live.current?.self.name??'Visitante',position:{x:actor.position.x,z:actor.position.z},adult:live.current?.adultConfirmed===true,blocked:live.current?.blockedPeople,seat:live.current?.self.seat,frozen:!!(live.current?.frozen||live.current?.cinema||live.current?.self.busy)}),(s,mode)=>{setLife(s);setLifeMode(mode);},message=>{setLifeMessage(message);gestureUntil=performance.now()+2500;});
    pokerVisitor.current=()=>({id:live.current?.self.id??previewVisitor.current,name:live.current?.self.name??'Visitante',position:{x:actor.position.x,z:actor.position.z},frozen:!!(live.current?.frozen||live.current?.cinema)});
    let quality=live.current?.low??false;
    let ownKey='',syncKey='',seatKey:string|undefined,lastDestination='',lastEmit=0,crossGoal:Place|null=null,roomTransition=false;
    let fp=false,yaw=Math.PI,pitch=-.08,dance=false,nearestKey='',near:HousePhone|null=null;
    const keys=new Set<string>();const gestures=createCameraGestures(),hostProximity=createHostProximity();let lastNearby:NearbyHost|null=null;
    dismissNearby.current=host=>{hostProximity.dismiss(performance.now(),host??lastNearby);lastNearby=null;setNearHost(null);};
    let crossSeat:{index:number;room:RoomId}|null=null;
    let path:Place[]=[],pendingSeat:{index:number;room:RoomId}|null=null,sitting=false,frame=0,last=performance.now(),zoom=live.current?3:1,targetZoom=zoom,currentView:View=live.current?.self.room??'house';
    const lights:Record<RoomId,boolean>={garage:true,living:true,bar:true};
    let ringing:{index:number;room:RoomId}|null=null,ringUntil=0,active=true;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const raycaster=new T.Raycaster(),pointer=new T.Vector2();
    const roomZoom=()=>el.clientWidth<700?1.6:2.05;
    function resize(){const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);const aspect=w/h;const span=Math.max(13,15/aspect);if(!manualFocus&&currentView!=='house'&&targetZoom!==3)targetZoom=roomZoom();
      camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();eyeCamera.aspect=aspect;eyeCamera.updateProjectionMatrix();}
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    function stand(){pendingResident=null;if(live.current?.self.seat)live.current.onSeat(undefined);if(sitting&&pendingSeat){const p=approachSeat(allSeats[pendingSeat.room][pendingSeat.index]);actor.position.set(p.x,0,p.z);}
      sitting=false;pendingSeat=null;setSeated(false);path=[];dance=false;setDancing(false);}
    function reservedForOther(id:string){const c=lifeTransport.state.social.concierge,own=live.current?.self.id??previewVisitor.current;return !!c&&(!!c.reservedSeats?.includes(id)||c.circles.some(r=>r.members.some(m=>m.id!==own&&m.seat===id)));}
    function sit(index:number,id:RoomId){if(live.current?.frozen)return;if(live.current){if(id!==live.current.self.room){if(live.current.onRoom(id))crossSeat={index,room:id};return;}const seat=seatsForRoom(id).find(s=>s.worldIndex===index);if(!seat||reservedForOther(seat.id)||live.current.people.some(p=>p.seat===seat.id)){setStatus('Esse lugar está ocupado. Escolha outro assento.');return;}}stand();const s=allSeats[id][index];if(!s)return;const goal=approachSeat(s);
      path=houseRoute(actor.position,goal);if(!path.length){setStatus('Escolha um lugar com passagem livre.');return;}pendingSeat={index,room:id};setRoomId(id);setLit(lights[id]);if(currentView!=='house'){currentView=id;setView(id);}setStatus(`Indo até ${s.name.toLowerCase()} em ${roomNames[id]}…`);}
    function goToPhone(index:number,id:RoomId){if(live.current?.frozen)return;if(live.current&&id!==live.current.self.room){live.current.onRoom(id);return;}stand();path=routeToPhone(actor.position,id,index);setStatus(path.length?'Indo até o telefone. Ao chegar perto, toque em “Ligar”.':'Não há passagem até este telefone. Experimente outro.');}
    function phone(){const target=nearbyPhone(actor.position);if(!target||live.current?.frozen)return;if(live.current){live.current.onPhone(`${target.room}-${target.index+1}`);return;}ringing={index:target.index,room:target.room};ringUntil=performance.now()+6000;setRing(target.index);setStatus('Demonstração da ligação: o telefone toca por alguns segundos. Chamadas reais estão na casa atual.');}
    function answer(){ringing=null;setRing(null);setStatus('Alô! Teste atendido. As ligações reais continuam na casa atual.');}
    function lookInside(){const center=roomOffsets[roomAt(actor.position)??'living'];yaw=Math.atan2(center.x-actor.position.x,center.z-actor.position.z);pitch=-.08;}
    function first(enabled:boolean){gestures.cancel();fp=enabled;setFirstPerson(enabled);avatar.visible=!enabled;roomIds.forEach(id=>rooms[id].interior.visible=enabled);keys.clear();path=[];if(enabled){lookInside();dance=false;setDancing(false);}setStatus(enabled?'Arraste para olhar. Use W A S D ou os controles para andar. Esc volta à casa.':'Toque no piso para passear pela casa.');}
    function play(kind:'lights'|'perform',on:boolean){const s=live.current;if(!s)return true;if(s.frozen)return false;return s.onPlay({id:crypto.randomUUID(),actor:s.self.id,name:s.self.name,at:Date.now(),room:s.self.room??'garage',kind,on,from:s.self.position,to:s.self.position});}
    controls.current={area:id=>{const area=areaById(id);if(live.current?.frozen)return;if(live.current){if(!live.current.onRoom(area.room,toShared(area.arrival,area.room)))return;}else{stand();actor.position.set(area.arrival.x,0,area.arrival.z);}manualFocus=null;currentView=area.room;targetZoom=3;setView(area.room);setRoomId(area.room);setActiveArea(id);setClose(true);},enteredRoom:id=>{manualFocus=null;currentView=id;targetZoom=3;},focus:v=>{manualFocus=null;first(false);currentView=v;targetZoom=v==='house'?1:roomZoom();if(v!=='house')setLit(lights[v]);},view:v=>{manualFocus=null;targetZoom=v?3:currentView==='house'?1:roomZoom();},seat:sit,stand,light:id=>{const next=live.current?live.current.play.lights?.on===false:!lights[id];if(!play('lights',next))return;lights[id]=next;rooms[id].lights(next);setLit(next);},phone,approachPhone:id=>goToPhone(3,id),answer,firstPerson:first,lookInside,move:(key,pressed)=>{if(pressed)keys.add(key);else keys.delete(key);},dance:()=>{if(live.current?.frozen)return;const next=!dance;if(!play('perform',next))return;stand();dance=next;setDancing(next);if(next){first(false);setStatus('Solta o passinho! Toque no piso para continuar andando.');}}};
    meetResident.current=id=>{if(live.current?.frozen||live.current?.self.busy)return;const circle=lifeTransport.state.social.concierge?.circles.find(c=>c.id===id),member=circle?.members.find(m=>m.id===(live.current?.self.id??previewVisitor.current));if(circle&&member){const seat=seatsForRoom(circle.room).find(s=>s.id===member.seat);if(seat){sit(seat.worldIndex,circle.room);setResidentTarget(null);}return;}const invite=lifeTransport.state.social.invites.find(i=>i.id===id&&i.stage==='ready'&&i.expires>Date.now());if(!invite?.point)return;stand();path=invite.from===(live.current?.self.id??previewVisitor.current)?approach(actor.position,invite.point):houseRoute(actor.position,invite.point);setResidentTarget(null);setLifeMessage('Indo ao encontro. Um oi já é um começo!');};
    residentAction.current=(action,target,request)=>{
      if(HOST_ACTIONS.has(action)){if(['solo','declineHost','declineCompany'].includes(action))dismissNearby.current?.();lifeTransport.command(action,target,request);if(action==='leaveCompany')setResidentTarget('dora');return;}
      if(live.current?.frozen||live.current?.cinema||live.current?.self.busy)return;
      if(['placeBed','cancelBed'].includes(action)){lifeTransport.command(action,target);return;}
      stand();const item=lifeTransport.state.items.find(i=>i.id===target);
      const destination=action==='return'&&item?ITEMS[item.id].position:targetPosition(lifeTransport.state,target);
      if(!destination)return;
      if(Math.hypot(actor.position.x-destination.x,actor.position.z-destination.z)<=1.35){actor.rotation.y=Math.atan2(destination.x-actor.position.x,destination.z-actor.position.z);lifeTransport.command(action,target);return;}
      path=approach(actor.position,destination);
      if(!path.length){setLifeMessage('Não há passagem livre até lá. Tente chegar por outro lado.');return;}
      pendingResident={action,target,started:performance.now()};setLifeMessage('Chegando perto…');
    };
    const groundPlane=new T.Plane(new T.Vector3(0,1,0),0);
    function groundAt(p:{x:number;y:number}){const rect=el.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((p.x-rect.left)/rect.width*2-1,-(p.y-rect.top)/rect.height*2+1),camera);return raycaster.ray.intersectPlane(groundPlane,new T.Vector3());}
    function onDown(e:PointerEvent){if(e.button!==0||live.current?.cinema)return;e.preventDefault();gestures.down(e.pointerId,{x:e.clientX,y:e.clientY});el.setPointerCapture(e.pointerId);}
    function onMove(e:PointerEvent){const delta=gestures.move(e.pointerId,{x:e.clientX,y:e.clientY});if(!delta||live.current?.cinema)return;
      if(fp){if(delta.count===1){yaw-=(delta.to.x-delta.from.x)*.006;pitch=T.MathUtils.clamp(pitch-(delta.to.y-delta.from.y)*.005,-.85,.75);}return;}
      const before=groundAt(delta.from);manualFocus??=cameraFocus.clone();
      zoom=targetZoom=T.MathUtils.clamp(zoom*delta.ratio,.7,4.5);camera.zoom=zoom;camera.updateProjectionMatrix();
      const after=groundAt(delta.to);if(before&&after){manualFocus.x=T.MathUtils.clamp(manualFocus.x+before.x-after.x,-18,15);manualFocus.z=T.MathUtils.clamp(manualFocus.z+before.z-after.z,-15,11);}
      cameraFocus.copy(manualFocus);camera.position.copy(cameraFocus).add(new T.Vector3(18,25,26));camera.lookAt(cameraFocus);camera.updateMatrixWorld();setClose(false);
    }
    function onUp(e:PointerEvent){const tap=gestures.up(e.pointerId,{x:e.clientX,y:e.clientY});if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);if(!tap||live.current?.frozen||live.current?.cinema)return;
      const rect=el.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,fp?eyeCamera:camera);
      const hits=raycaster.intersectObjects([...roomIds.map(id=>rooms[id].root),...residentVisuals.roots.values(),residentFixtures.root],true).filter(hit=>{let node:T.Object3D|null=hit.object;while(node){if(!node.visible)return false;node=node.parent;}return true;});
      for(const hit of hits){let residentNode:T.Object3D|null=hit.object;while(residentNode&&!residentNode.userData.residentTarget)residentNode=residentNode.parent;if(residentNode?.userData.residentTarget){setResidentTarget(String(residentNode.userData.residentTarget));setLifeMessage('');return;}let root:T.Object3D=hit.object;while(root.parent&&!root.userData.roomId)root=root.parent;const id=root.userData.roomId as RoomId;if(!id)return;
        const seats=allSeats[id];let o:T.Object3D|null=hit.object;while(o&&o!==root){
        if(o.userData.kind==='poker'){if(pokerSeat.current===null)sit(10,'bar');setPokerOpen(true);return;}
        if(o.userData.kind==='television'){live.current?.onTelevision?.(id);return;}
        if(o.userData.kind==='seat'){const nearest=(o.userData.indices as number[]).reduce((a,b)=>Math.hypot(seats[a].x-hit.point.x,seats[a].z-hit.point.z)<Math.hypot(seats[b].x-hit.point.x,seats[b].z-hit.point.z)?a:b);sit(nearest,id);return;}
        if(o.userData.kind==='phone'){const index=o.userData.index as number;const near=nearbyPhone(actor.position);if(near?.index===index&&near.room===id){if(ringing?.index===index&&ringing.room===id)answer();else setStatus('Você está perto do telefone. Toque em “Ligar” para conversar.');}else goToPhone(index,id);return;}o=o.parent;}
        if(hit.object===rooms[id].floor||hit.point.y<.065){stand();path=houseRoute(actor.position,hit.point);setStatus(path.length?'Passeando pela casa…':'Esse lugar está ocupado por um móvel. Toque no piso livre.');return;}
        // Walls and furniture occlude the floor; do not walk through them.
        return;
      }
    }
    function release(){gestures.cancel();keys.clear();}
    function keyDown(e:KeyboardEvent){if(!fp||e.target instanceof HTMLElement&&e.target.closest('input,textarea,select,[contenteditable=true]'))return;if(e.key==='Escape'){first(false);return;}if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();keys.add(e.key);}}
    function keyUp(e:KeyboardEvent){keys.delete(e.key);}
    function visibility(){if(document.hidden){release();music.current?.stop();setMusicOn(false);}}
    function travel(next:Place){const residents=lifeTransport.state.residents.map(r=>r.position);if(residents.some(p=>Math.hypot(next.x-p.x,next.z-p.z)<.43&&Math.hypot(next.x-p.x,next.z-p.z)<Math.hypot(actor.position.x-p.x,actor.position.z-p.z))){const goal=path[path.length-1];if(goal)path=houseRoute(actor.position,goal,residents);return false;}const s=live.current;if(s){
      if(s.frozen)return false;
      const collision=s.people.some(p=>{const q=remote.actors.get(p.id)?.root.position??toWorld(p.position,p.room??'garage');const before=Math.hypot(actor.position.x-q.x,actor.position.z-q.z),after=Math.hypot(next.x-q.x,next.z-q.z);return after<.52&&after<before;});
      if(collision){const goal=path[path.length-1];if(goal)path=houseRoute(actor.position,goal,s.people.map(p=>remote.actors.get(p.id)?.root.position??toWorld(p.position,p.room??'garage')));setStatus(path.length?'Passando ao lado para dar espaço…':'Alguém está passando. Toque em outro ponto para contornar.');return false;}
      const room=roomAt(next);if(room&&room!==s.self.room){roomTransition=true;crossGoal=path[path.length-1]??null;path=[];if(!s.onRoom(room,toShared(next,room))){keys.clear();crossGoal=null;}return false;}
    }actor.position.x=next.x;actor.position.z=next.z;return true;}
    function endDrag(e:PointerEvent){/* Normal pointer-up already removed this pointer. */if(e.type==='lostpointercapture'&&gestures.count&&!el.hasPointerCapture(e.pointerId))gestures.up(e.pointerId,{x:Infinity,y:Infinity});}
    el.addEventListener('pointerdown',onDown);el.addEventListener('pointermove',onMove);el.addEventListener('pointerup',onUp);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',endDrag);
    window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',release);document.addEventListener('visibilitychange',visibility);
    let lastTVProjection='';
    function tick(now:number){if(!active)return;if(live.current?.cinema&&now-last<1000/30){frame=requestAnimationFrame(tick);return;}const dt=Math.min((now-last)/1000,.05);last=now;let moving=false;roomTransition=false;
      const state=live.current;
      if(state){const own=state.self,room=own.room??'garage',key=`${own.id}:${room}:${state.revision}`;
        if((state.low||!!state.cinema&&el.clientWidth<700)!==quality){quality=state.low||!!state.cinema&&el.clientWidth<700;renderer.setPixelRatio(Math.min(devicePixelRatio,quality?1:1.5));renderer.shadowMap.enabled=!quality;resize();}
        if(key!==syncKey){sitting=false;pendingSeat=null;setSeated(false);const p=toWorld(own.position,room);actor.position.set(p.x,0,p.z);path=crossGoal?houseRoute(p,crossGoal):[];crossGoal=null;syncKey=key;seatKey=undefined;lastDestination=JSON.stringify(state.destination);}
        const look=`${own.avatar}:${appearanceKey(own.appearance)}`;
        if(look!==ownKey){actor.remove(avatar);disposeAvatar(avatar);avatar=createAdultAvatar(own.avatar,own.appearance);applyAvatarMaterials(avatar,own.appearance,own.avatar,avatarMaterials);const box=new T.Box3().setFromObject(avatar),scale=1.5/(box.max.y-box.min.y);avatar.scale.setScalar(scale);avatar.position.y=-box.min.y*scale;avatarBaseY=avatar.position.y;hipHeight=avatar.position.y+avatar.getObjectByName('adult-leg-left')!.position.y*scale;avatar.visible=!fp;actor.add(avatar);ownKey=look;}
        if(own.seat!==seatKey){seatKey=own.seat;const seat=seatsForRoom(room).find(s=>s.id===own.seat);if(seat){const s=allSeats[room][seat.worldIndex];pendingSeat={room,index:seat.worldIndex};actor.position.set(s.x+Math.sin(s.angle)*.18,seatedOrigin(s.height,hipHeight),s.z+Math.cos(s.angle)*.18);actor.rotation.y=s.angle;sitting=true;path=[];setSeated(true);}else{actor.position.y=0;sitting=false;setSeated(false);pendingSeat=null;const p=toWorld(own.position,room);actor.position.set(p.x,0,p.z);}}
        const destination=JSON.stringify(state.destination);if(destination!==lastDestination){lastDestination=destination;if(!own.seat)path=houseRoute(actor.position,toWorld(state.destination,room));}
        if(state.frozen||state.cinema){pendingResident=null;path=[];keys.clear();dance=false;setDancing(false);}
        if(crossSeat&&crossSeat.room===room){const target=crossSeat;crossSeat=null;if(!state.frozen&&!state.cinema)sit(target.index,target.room);}
        remote.sync(state.people,now,dt,reduced,state.play.perform,motionShare.current.frames.current);
        playObjects.sync(state,now);
        dance=!state.frozen&&!!state.play.perform?.on&&state.play.perform.actor===own.id&&!sitting&&Date.now()-state.play.perform.at<6000;
        rooms[room].screen(state.televisionOn===true||state.play.screen?.on===true);
        const roomLit=state.play.lights?.on!==false;if(lights[room]!==roomLit){lights[room]=roomLit;setLit(roomLit);}
        roomIds.forEach(id=>{if(id===room)rooms[id].lights(state.play.lights?.on!==false);});
      }
      if(fp&&keys.size&&!state?.frozen){if(sitting)stand();path=[];pendingSeat=null;
        yaw+=((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*dt*1.7;
        const forward=(keys.has('w')||keys.has('ArrowUp')?1:0)-(keys.has('s')||keys.has('ArrowDown')?1:0),side=(keys.has('d')?1:0)-(keys.has('a')?1:0),norm=Math.max(1,Math.hypot(forward,side));
        const next=moveInHouse(actor.position,(Math.sin(yaw)*forward-Math.cos(yaw)*side)*dt*1.7/norm,(Math.cos(yaw)*forward+Math.sin(yaw)*side)*dt*1.7/norm);moving=Math.hypot(next.x-actor.position.x,next.z-actor.position.z)>.001&&travel(next);actor.rotation.y=yaw;
      }
      if(path.length){const p=path[0],dx=p.x-actor.position.x,dz=p.z-actor.position.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*1.7);
        const reached=travel({x:actor.position.x+dx/(d||1)*step,z:actor.position.z+dz/(d||1)*step});actor.rotation.y=Math.atan2(dx,dz);moving=reached&&d>.01;if(reached&&d<.04)path.shift();
        if(reached&&!path.length){if(pendingSeat!==null){const s=allSeats[pendingSeat.room][pendingSeat.index];if(state){const seat=seatsForRoom(pendingSeat.room).find(s=>s.worldIndex===pendingSeat!.index);if(seat&&!reservedForOther(seat.id)&&!state.people.some(p=>p.seat===seat.id))state.onSeat(seat.id);else setLifeMessage('Esse lugar ficou ocupado. Escolha outro assento.');pendingSeat=null;}else{actor.position.set(s.x+Math.sin(s.angle)*.18,seatedOrigin(s.height,hipHeight),s.z+Math.cos(s.angle)*.18);actor.rotation.y=s.angle;sitting=true;setSeated(true);}setStatus(`Sentado em ${s.name.toLowerCase()}. Use “Levantar” para continuar.`);}else setStatus('Escolha um móvel ou toque no piso para continuar.');}}
      if(state&&!sitting&&!state.frozen&&!roomTransition&&now-lastEmit>100){const room=state.self.room??'garage';state.onMove(toShared(actor.position,room));lastEmit=now;}
      if(pendingResident&&!path.length&&!roomTransition){const todo=pendingResident,entry=lifeTransport.state.items.find(i=>i.id===todo.target),destination=todo.action==='return'&&entry?ITEMS[entry.id].position:targetPosition(lifeTransport.state,todo.target);
        if(destination&&Math.hypot(actor.position.x-destination.x,actor.position.z-destination.z)<=1.45){pendingResident=null;actor.rotation.y=Math.atan2(destination.x-actor.position.x,destination.z-actor.position.z);lifeTransport.command(todo.action,todo.target);}
        else if(now-todo.started<25000&&destination){path=approach(actor.position,destination);}
        else{pendingResident=null;setLifeMessage('Ele foi para outro lugar. Toque novamente para chegar perto.');}}
      if(keys.size)pendingResident=null;
      const residentState=lifeTransport.state;
      const visitorId=state?.self.id??previewVisitor.current,ui=interactionUI.current;
      const greeting=hostProximity.update(actor.position,residentState.residents,now,!state?.frozen&&!state?.cinema&&!state?.self.busy&&!motionFrame.current&&!ui.pokerOpen&&!ui.residentTarget&&!ui.quietResidents&&targetZoom===3&&!residentState.social.solo[visitorId]&&!moving&&!path.length);
      if(greeting!==lastNearby){lastNearby=greeting;setNearHost(greeting);}
      el.dataset.nearHost=greeting??'';
      const visualItems=residentState.items.map(item=>{const holder=item.holder===state?.self.id?actor:remote.actors.get(item.holder??'')?.root;return holder?{...item,position:{x:holder.position.x+.2,z:holder.position.z+.2},height:.85}:item;});
      residentVisuals.sync(residentState.residents,visualItems,now,dt,reduced);
      residentFixtures.sync(residentState,residentState.bed.holder===(state?.self.id??previewVisitor.current)?actor:remote.actors.get(residentState.bed.holder??'')?.root);
      el.dataset.dogActivity=residentState.residents.find(r=>r.id==='biscoito')?.activity??'';
      el.dataset.bedCarried=String(residentState.bed.holder===(state?.self.id??previewVisitor.current));
      for(const r of residentState.residents){const label=residentLabels.current.get(r.id);if(!label)continue;const display=residentVisuals.roots.get(r.id)?.position??new T.Vector3(r.position.x,0,r.position.z);const p=new T.Vector3(display.x,r.id==='biscoito'?.95:1.9,display.z).project(fp?eyeCamera:camera);label.style.left=`${(p.x+1)*50}%`;label.style.top=`${(1-p.y)*50}%`;label.hidden=(!fp&&zoom<1.5&&el.clientWidth<700)||Math.abs(p.x)>.9||Math.abs(p.y)>.8||p.z>1||p.z< -1;}
      el.dataset.residentMode=lifeTransport.mode;el.dataset.residents=String(residentState.residents.length);el.dataset.carried=heldItem(residentState,state?.self.id??previewVisitor.current)?.id??'';
      animateAdult(avatar,(moving||dance)&&!reduced,now/1000*(dance?1.6:1),sitting,dt);
      if(residentState.bed.holder===(state?.self.id??previewVisitor.current)){for(const name of ['adult-arm-left','adult-arm-right']){const arm=avatar.getObjectByName(name);if(arm)arm.rotation.x=-1.05;}}
      if(!moving&&!sitting&&now<gestureUntil&&!reduced){const arm=avatar.getObjectByName('adult-arm-right');if(arm)arm.rotation.x=-1.05;}
      avatar.rotation.z=dance&&!reduced?Math.sin(now*.007)*.07:0;avatar.position.y=avatarBaseY+(dance&&!reduced?Math.abs(Math.sin(now*.007))*.05:0);
      const motion=motionFrame.current;
      const canPose=!moving&&!dance&&!sitting&&!state?.frozen&&!state?.cinema&&!state?.self.busy&&!heldItem(residentState,visitorId)&&residentState.bed.holder!==visitorId;
      motionShare.current.publish(motion&&canPose&&now-motion.at<500?motion.pose:null);
      if(motion||motionUsed){motionUsed=true;smoothPose(motionPose,motion&&canPose&&now-motion.at<500?motion.pose:neutralPose(),dt);applyBodyPose(avatar,motionPose);}
      zoom+=(targetZoom-zoom)*(reduced?1:Math.min(1,dt*5));camera.zoom=zoom;
      const focus=manualFocus??(targetZoom===3?new T.Vector3(actor.position.x,.65,actor.position.z):currentView==='house'?new T.Vector3(-2,.5,-2):new T.Vector3(roomOffsets[currentView].x,.5,roomOffsets[currentView].z));
      cameraFocus.lerp(focus,reduced?1:Math.min(1,dt*4));camera.position.copy(cameraFocus).add(new T.Vector3(18,25,26));camera.lookAt(cameraFocus);camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      eyeCamera.position.set(actor.position.x,sitting?actor.position.y+1.25:1.35,actor.position.z);eyeCamera.lookAt(eyeCamera.position.x+Math.sin(yaw)*Math.cos(pitch),eyeCamera.position.y+Math.sin(pitch),eyeCamera.position.z+Math.cos(yaw)*Math.cos(pitch));eyeCamera.updateMatrixWorld();
      projectedMarkers.current.forEach((m,i)=>{const button=markerRefs.current.get(i);if(!button)return;const p=new T.Vector3(m.x,.13,m.z).project(camera);button.style.left=`${(p.x+1)*50}%`;button.style.top=`${(1-p.y)*50}%`;const obscuresPerson=[actor,...Array.from(remote.actors.values()).map(a=>a.root)].some(root=>{const q=root.position.clone().add(new T.Vector3(0,.9,0)).project(camera);return Math.abs(p.x-q.x)*el.clientWidth/2<90&&Math.abs(p.y-q.y)*el.clientHeight/2<100;});button.hidden=fp||obscuresPerson||p.x<-.9||p.x>.9||p.y<-.85||p.y>.85;});
      if(state){for(const person of [state.self,...state.people]){const root=person.id===state.self.id?actor:remote.actors.get(person.id)?.root,button=personLabels.current.get(person.id);if(!root||!button)continue;const p=root.position.clone().add(new T.Vector3(0,1.85,0)).project(fp?eyeCamera:camera);button.style.left=`${(p.x+1)*50}%`;button.style.top=`${(1-p.y)*50}%`;const head=root.position.clone().add(new T.Vector3(0,1.5,0)).project(fp?eyeCamera:camera);button.dataset.headY=String((1-head.y)*el.clientHeight/2);button.dataset.motionActive=String(!!root.userData.motionActive);button.dataset.armAngle=Number(root.userData.armAngle??0).toFixed(2);button.dataset.armForward=Number(root.userData.armForward??0).toFixed(2);button.hidden=(fp&&person.id===state.self.id)||p.z>1||p.z< -1||Math.abs(p.x)>.96||Math.abs(p.y)>.9;
        if(inviteLabel.current&&state.bubbleOwner===person.id){inviteLabel.current.style.left=button.style.left;inviteLabel.current.style.top=button.style.top;}}
      }
      near=nearbyPhone(actor.position);const key=near?`${near.room}-${near.index}`:'';if(key!==nearestKey){nearestKey=key;setNearPhone(near);}
      roomIds.forEach(id=>{const room=rooms[id];room.update(now,reduced||quality);if(!reduced)room.disco.rotation.y=now*.00012;
      room.phones.forEach((p,i)=>{const rings=state?state.ringingPhones.includes(`${id}-${i+1}`):ringing?.index===i&&ringing.room===id;p.rotation.z=rings&&!reduced?Math.sin(now*.04)*.10:0;});});
      if(ringing!==null&&now>ringUntil){ringing=null;setRing(null);setStatus('O telefone parou de tocar. Você pode testar novamente.');}
      rooms.living.cutaway(!fp&&!manualFocus&&targetZoom===3&&actor.position.z< -8&&!state?.cinema);
      let activeCamera:T.Camera=fp?eyeCamera:camera;
      if(state?.cinema){
        const tv=rooms[state.self.room??'garage'].television,center=new T.Vector3();tv.getWorldPosition(center);
        const dimensions=(tv.geometry as T.PlaneGeometry).parameters as {width:number;height:number};
        const w=el.clientWidth,h=el.clientHeight;
        // Head-on orthographic framing lets the official iframe line up with the physical screen.
        const targetWidth=Math.min(w-12,Math.max(356,w*.78),(h-24)*dimensions.width/dimensions.height);
        const unitsPerPixel=dimensions.width/Math.max(1,targetWidth);
        cinemaCamera.left=-w*unitsPerPixel/2;cinemaCamera.right=w*unitsPerPixel/2;
        cinemaCamera.top=h*unitsPerPixel/2;cinemaCamera.bottom=-h*unitsPerPixel/2;
        cinemaCamera.position.copy(center).add(new T.Vector3(0,0,1));cinemaCamera.lookAt(center);cinemaCamera.updateProjectionMatrix();cinemaCamera.updateMatrixWorld();
        activeCamera=cinemaCamera;
        const a=tv.localToWorld(new T.Vector3(-dimensions.width/2,dimensions.height/2,0)).project(cinemaCamera);
        const b=tv.localToWorld(new T.Vector3(dimensions.width/2,-dimensions.height/2,0)).project(cinemaCamera);
        const rect=[(a.x+1)*w/2,(1-a.y)*h/2,(b.x-a.x)*w/2,(a.y-b.y)*h/2].map(n=>`${n.toFixed(2)}px`),projection=rect.join(',');
        if(tvSlot.current&&projection!==lastTVProjection){lastTVProjection=projection;Object.assign(tvSlot.current.style,{left:rect[0],top:rect[1],width:rect[2],height:rect[3]});}
      }
      else if(tvSlot.current&&lastTVProjection){lastTVProjection='';tvSlot.current.style.width='0px';tvSlot.current.style.height='0px';}
      roomIds.forEach(id=>rooms[id].screenCaption(id===state?.self.room?state.televisionTitle:undefined));
      renderer.render(scene,activeCamera);el.dataset.drawCalls=String(renderer.info.render.calls);el.dataset.triangles=String(renderer.info.render.triangles);el.dataset.camera=state?.cinema?'cinema':fp?'first-person':'overview';el.dataset.pixelRatio=String(renderer.getPixelRatio());el.dataset.shadows=String(renderer.shadowMap.enabled);el.dataset.nearPhone=nearestKey;el.dataset.yaw=yaw.toFixed(2);el.dataset.dancing=String(dance);
      el.dataset.focus=`${cameraFocus.x.toFixed(2)},${cameraFocus.z.toFixed(2)}`;el.dataset.cameraMode=manualFocus?'manual':targetZoom===3?'follow':'room';el.dataset.gesturePointers=String(gestures.count);
      el.dataset.position=`${actor.position.x.toFixed(2)},${actor.position.z.toFixed(2)}`;
      const here=areaAt(actor.position);if(here&&el.dataset.area!==here.id){el.dataset.area=here.id;setActiveArea(here.id);}el.dataset.avatarFinish=avatarTslEnabled?'tsl':'standard';
      el.dataset.people=String(state?.people.length??0);el.dataset.televisions='3';
      el.dataset.seated=String(sitting);el.dataset.hipHeight=(actor.position.y+hipHeight).toFixed(3);el.dataset.seatHeight=pendingSeat!==null?String(allSeats[pendingSeat.room][pendingSeat.index].height):'';el.dataset.view=currentView;el.dataset.zoom=zoom.toFixed(2);
      frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);setReady(true);
    return()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();controls.current=undefined;music.current?.stop();window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',visibility);el.removeEventListener('pointermove',onMove);el.removeEventListener('pointercancel',release);el.removeEventListener('lostpointercapture',endDrag);el.removeEventListener('pointerdown',onDown);el.removeEventListener('pointerup',onUp);roomIds.forEach(id=>rooms[id].dispose());sun.shadow.map?.dispose();
      dismissNearby.current=undefined;lifeTransport.dispose();residentVisuals.dispose();residentFixtures.dispose();residentAction.current=undefined;meetResident.current=undefined;remote.dispose();playObjects.dispose();disposeAvatar(avatar);renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <div className={`garage3d-page${session?' is-live-house':''}${session?.cinema?' is-cinema':''}`}>
    <header><Link to="/garagem"><ArrowLeft size={17}/> Voltar à casa</Link><span>DISQUE AMIZADE <i>/</i> ESTUDO 3D</span><span className="garage3d-version">{view==='house'?'Casa inteira · 31 lugares':`${roomNames[roomId]} · ${seats.length} lugares`}</span></header>
    <section className="garage3d-intro"><div><p>A MESMA CASA. UMA NOVA DIMENSÃO.</p><h1>Entre. Fique à vontade.</h1></div><p>Um cantinho para ouvir música,<br/>puxar uma cadeira e encontrar sua turma.</p></section>
    <nav className="garage3d-rooms" aria-label="Enquadramento da casa">
      {session?.cinema&&<button className="cinema-exit" onClick={session.onExitCinema}><ArrowLeft size={14}/> Voltar à casa</button>}
      <button aria-pressed={close} onClick={()=>{setClose(true);setView(roomId);controls.current?.focus(roomId);controls.current?.view(true);}}>Meu avatar</button>
      {session?.onTelevision&&<button disabled={session.frozen} onClick={()=>session.onTelevision?.(roomId)}><Tv size={14}/> Televisão</button>}
      <button aria-pressed={view==='house'&&!close} onClick={()=>focus('house')}>Casa inteira</button>
      <select className="house-area-select" aria-label="Explorar área da casa" value={activeArea} disabled={session?.frozen} onChange={e=>controls.current?.area(e.target.value as AreaId)}>{HOUSE_AREAS.filter(a=>a.id!=='hall').map(a=><option key={a.id} value={a.id}>{a.name} · {a.topic}</option>)}</select>
    </nav>
    {import.meta.env.VITE_ENABLE_AVATAR_MOTION!=='false'&&<MotionExperiment frame={motionFrame} sharing={sharedMotion.sharing} shareAvailable={!!session&&import.meta.env.VITE_ENABLE_AVATAR_MOTION_SHARING!=='false'} shareConnected={sharedMotion.connected} realtime={sharedMotion.realtime} onShare={sharedMotion.choose} onStop={()=>sharedMotion.publish(null)} blocked={!!(session?.frozen||session?.cinema||session?.self.busy||pokerOpen)} onFocus={()=>{dismissNearby.current?.();setResidentTarget(null);setClose(true);setFirstPerson(false);controls.current?.firstPerson(false);controls.current?.view(true);}}/>}
    <section className={`garage3d-stage ${firstPerson?'is-first-person':''}`} aria-label="Casa tridimensional integrada">
      <div className="house3d-tv-slot" ref={attachTV} aria-hidden="true" />
      <div ref={host} className="garage3d-canvas" aria-label="Toque para andar. Arraste para mover a vista. Use dois dedos para dar zoom."/>
      {!ready&&!error&&<div className="garage3d-loading">Preparando a casa…</div>}
      {error&&<p className="garage3d-loading">{error} <Link to="/rooms">Ver salas online</Link></p>}
      {session&&[session.self,...session.people].map(person=>{const pref=session.preferences[person.id],intent=INTENTIONS[person.appearance?.intention??'hidden'],mine=person.id===session.self.id;return <button key={person.id} ref={node=>{if(node)personLabels.current.set(person.id,node);else personLabels.current.delete(person.id);}} className={`house3d-person${mine?' is-self':''}`} title={[person.name,pref?.text?'Aceita mensagens':'',pref?.video?'Aceita vídeo':'',pref?.orientation,person.busy?'Em conversa':''].filter(Boolean).join(' · ')} onClick={()=>{if(person.room!==session.self.room&&person.room){session.onRoom(person.room);return;}session.onSelect(person.id);}} aria-label={`Ver ${mine?'meu perfil':person.name}`}><span className="house3d-name">{intent?.symbol} <strong>{mine?'Você':person.name}</strong>{!mine&&<span className="house3d-availability" aria-hidden="true">{pref?.text&&<MessageCircle size={11}/>} {pref?.video&&<Video size={11}/>}</span>}</span>{session.chatBubbles[person.id]&&<span className="room-speech">{session.chatBubbles[person.id]}</span>}</button>;})}
      {ready&&life.residents.map(r=><button key={r.id} ref={node=>{if(node)residentLabels.current.set(r.id,node);else residentLabels.current.delete(r.id);}} className="resident-label" aria-label={`Interagir com ${NAMES[r.id]}`} onClick={()=>{setResidentTarget(r.id);setLifeMessage('');}}>{NAMES[r.id]} <small>· virtual</small>{!quietResidents&&life.speech?.owner===r.id&&life.speech.until>Date.now()&&<span className="resident-speech">{life.speech.text}</span>}</button>)}
      {ready&&<ResidentPanel nearbyHost={view==='house'?null:nearHost} onDismissNearby={()=>dismissNearby.current?.()} seat={session?.self.seat} state={life} visitor={session?.self.id??previewVisitor.current} selected={residentTarget} mode={lifeMode} disabled={!!(session?.frozen||session?.self.busy)} message={lifeMessage} muted={quietResidents} onMute={()=>setQuietResidents(v=>!v)} onSelect={id=>{if(!id&&(residentTarget==='dora'||residentTarget==='teo'))dismissNearby.current?.(residentTarget);setResidentTarget(id);setLifeMessage('');}} onMeet={id=>meetResident.current?.(id)} onAction={(action,target,request)=>residentAction.current?.(action,target,request)}/>}
      {ready&&<PokerPanel avatar={session?.self.avatar??0} appearance={session?.self.appearance??presetAppearance(0)} unavailable={!!session?.frozen} onCallActive={session?.onPokerCall} open={pokerOpen} onClose={()=>setPokerOpen(false)} getVisitor={()=>pokerVisitor.current()} onSeat={seat=>{pokerSeat.current=seat;if(seat!==null)controls.current?.seat(7+seat,'bar');}}/>}
      {session?.bubble&&<div className="house3d-invite" ref={inviteLabel}>{session.bubble}</div>}
      {ready&&visibleMarkers.map((m,i)=><button key={`${view}-${i}`} ref={el=>{if(el)markerRefs.current.set(i,el);else markerRefs.current.delete(i);}} className={`garage3d-seat-marker ${view==='house'?'garage3d-room-marker':''}`} onClick={()=>view==='house'&&m.area?controls.current?.area(m.area):m.room==='bar'&&m.name.startsWith('Pôquer')?((pokerSeat.current===null&&controls.current?.seat(10,'bar')),setPokerOpen(true)):controls.current?.seat(m.indices.find(i=>!session?.people.some(p=>p.seat===seatsForRoom(m.room).find(s=>s.worldIndex===i)?.id))??m.indices[0],m.room)} aria-label={view==='house'?`Explorar ${m.name}`:`Sentar: ${m.name}`}><Armchair size={14}/><span>{m.name}<small>{view==='house'?'Aproximar →':m.name.startsWith('Pôquer')?'4 lugares · Jogar':`${m.indices.length} lugares · Sentar`}</small></span></button>)}
      <div className="garage3d-camera"><button disabled={!ready} aria-pressed={firstPerson} onClick={()=>controls.current?.firstPerson(!firstPerson)}><Eye size={16}/>{firstPerson?'Sair da primeira pessoa':'Primeira pessoa'}</button>{!firstPerson&&<><button disabled={!ready} onClick={()=>{setClose(!close);controls.current?.view(!close);}}><Maximize2 size={16}/>{close?'Ver ambiente inteiro':'Chegar mais perto'}</button><button aria-label="Restaurar câmera" onClick={()=>{setClose(false);controls.current?.view(false);}}><RotateCcw size={16}/></button></>}</div>
      {!firstPerson&&<span className="house-gesture-hint">Toque para andar · Arraste a vista · Pinça para zoom</span>}
      {firstPerson&&<button className="garage3d-look-reset" onClick={()=>controls.current?.lookInside()} aria-label="Olhar para dentro do ambiente"><RotateCcw size={16}/></button>}
      {nearPhone&&<div className="garage3d-phone-prompt"><Phone size={19}/><span>Telefone · {roomNames[nearPhone.room]}<small>{session?'Disque Surpresa · encontro 1 a 1':'Demonstração nesta prévia'}</small></span><button disabled={session?.frozen} onClick={()=>session?controls.current?.phone():ring!==null?controls.current?.answer():controls.current?.phone()}>{(session?session.ringingPhones.includes(`${nearPhone.room}-${nearPhone.index+1}`):ring!==null)?'Atender':'Ligar'}</button></div>}
      {firstPerson?<><div className="garage3d-look-hint">Arraste para olhar · W A S D para andar</div><div className="garage3d-walk-controls" aria-label="Mover em primeira pessoa">{[['ArrowLeft','Virar à esquerda',ArrowLeft],['ArrowUp','Andar para frente',ArrowUp],['ArrowDown','Andar para trás',ArrowDown],['ArrowRight','Virar à direita',ArrowRight]].map(([key,label,Icon])=>{const Symbol=Icon as typeof ArrowLeft;return <button key={String(key)} aria-label={String(label)} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);controls.current?.move(String(key),true);}} onPointerUp={()=>controls.current?.move(String(key),false)} onPointerCancel={()=>controls.current?.move(String(key),false)} onLostPointerCapture={()=>controls.current?.move(String(key),false)} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();controls.current?.move(String(key),true);}}} onKeyUp={()=>controls.current?.move(String(key),false)} onBlur={()=>controls.current?.move(String(key),false)}><Symbol size={20}/></button>;})}</div></>:<div className="garage3d-caption"><span>{view==='house'?`CASA INTEGRADA / ${HOUSE_AREAS.length-1} ÁREAS / ${roomIds.reduce((n,id)=>n+seatsFor(id).length,0)} LUGARES`:`${areaById(activeArea).name.toUpperCase()} · ${areaById(activeArea).topic}`}</span><p>{view==='house'?'Escolha um cantinho. A casa é toda sua.':areaById(activeArea).question}</p></div>}
    </section>
    <HouseTray><section className="garage3d-tools" aria-label="Interações da garagem">
      <p className="garage3d-tools-room">Interações · {roomNames[roomId]}</p>
      <div className="garage3d-actions">{!session&&<button disabled={!ready} onClick={()=>controls.current?.light(roomId)}><Lightbulb size={18}/>{lit?'Apagar luzes':'Acender luzes'}</button>}
      <button disabled={!ready} onClick={()=>{if(seated)controls.current?.stand();else controls.current?.seat(0,roomId);}}>{seated?<Footprints size={18}/>:<Armchair size={18}/>} {seated?'Levantar':roomId==='bar'?'Sentar no balcão':'Sentar no sofá'}</button>
      <button disabled={!ready} onClick={()=>controls.current?.approachPhone(roomId)}><Phone size={18}/>Ir até o telefone</button>
      {roomId==='bar'&&<button disabled={!ready||session?.frozen} onClick={()=>{if(pokerSeat.current===null)controls.current?.seat(10,'bar');setPokerOpen(true);}}>♠ Jogar pôquer</button>}
      <select aria-label="Escolher assento" disabled={!ready} defaultValue="" onChange={e=>{controls.current?.seat(Number(e.target.value),roomId);e.target.value='';}}><option value="" disabled>Escolher um lugar</option>{seats.map((s,i)=><option key={s.name} value={i} disabled={session?.people.some(p=>p.seat===seatsForRoom(roomId).find(s=>s.worldIndex===i)?.id)}>{s.name}{session?.people.some(p=>p.seat===seatsForRoom(roomId).find(s=>s.worldIndex===i)?.id)?" · ocupado":""}</option>)}</select></div>
      <p role="status">{status}</p>
    </section>
    <section className="garage3d-pastimes" aria-label="Enquanto a turma não chega"><div><p>ENQUANTO A TURMA NÃO CHEGA</p><h2>Aproveite a casa no seu ritmo.</h2><span>Explore, ensaie um passinho ou guarde um assunto para depois.</span></div><div className="garage3d-actions"><>{!session&&<><button disabled={!ready} aria-pressed={musicOn} onClick={()=>void toggleMusic()}><Music2 size={17}/>{musicOn?'Desligar som':'Ligar som da casa'}</button><button disabled={!ready} aria-pressed={dancing} onClick={()=>controls.current?.dance()}><Sparkles size={17}/>{dancing?'Parar de dançar':'Dançar'}</button></>}<button onClick={()=>setQuestion(n=>(n+1)%questions.length)}>Tirar uma carta</button></></div>{question>=0&&<blockquote aria-live="polite"><small>PARA PUXAR ASSUNTO</small>{questions[question]}</blockquote>}</section>
    </HouseTray>{!session&&<footer><span>Prévia para avaliar o espaço e as interações. Sem outras pessoas ou chamadas reais nesta versão.</span><Link to="/garagem">Ir para a casa atual →</Link></footer>}
  </div>;
}
