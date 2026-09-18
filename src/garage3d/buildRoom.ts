import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { phones, furniture, seatsFor, barTables, plants, type RoomId } from './layout';

export function buildRoom(scene:T.Scene, roomId:RoomId='garage', integrated=false) {
  const seats=seatsFor(roomId);
  const root=new T.Group(); scene.add(root);
  const cube=new RoundedBoxGeometry(1,1,1,2,.04);
  const sphere=new T.SphereGeometry(1,12,8);
  const materials=new Map<string,T.MeshStandardMaterial>();
  let seed=417; const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function material(color:string){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.82}));return materials.get(color)!;}
  function box(parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number){
    const m=new T.Mesh(cube,material(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function ball(parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number){
    const m=new T.Mesh(sphere,material(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;parent.add(m);return m;
  }
  function cylinder(parent:T.Object3D,color:string,x:number,y:number,z:number,r:number,h:number){
    const m=new T.Mesh(new T.CylinderGeometry(r,r*.86,h,16),material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function texture(kind:'floor'|'wall'|'wood'){
    const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d')!;
    ctx.fillStyle=kind==='wood'?'#ab8459':kind==='floor'?'#c9b59b':'#d9b58d';ctx.fillRect(0,0,512,512);
    const colors=kind==='floor'?['#7d6958','#eee4cd','#ac7157','#657574','#b79a7b']:['#cfaa81','#e6caa5','#c9a47b'];
    for(let i=0;i<(kind==='floor'?2600:14000);i++){
      const x=random()*512,y=random()*512,s=kind==='floor'?1+random()*4:random()*2;
      ctx.fillStyle=colors[Math.floor(random()*colors.length)];ctx.globalAlpha=kind==='floor'?.8:.25;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+s,y+1);ctx.lineTo(x+s*.7,y+s);ctx.lineTo(x-1,y+s*.6);ctx.fill();
    }
    if(kind==='wood'){
      ctx.globalAlpha=1;ctx.lineWidth=2;ctx.strokeStyle='#765237';
      for(let row=0;row<8;row++){const y=row*64;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();const x=row%2?128:384;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+64);ctx.stroke();
        ctx.globalAlpha=.18;ctx.lineWidth=1;for(let i=0;i<15;i++){ctx.beginPath();const start=random()*512;const yy=y+random()*64;ctx.moveTo(start,yy);ctx.lineTo(start+random()*100,yy+random()*2);ctx.stroke();}ctx.globalAlpha=1;ctx.lineWidth=2;
      }
    }
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='floor'?3:2,kind==='floor'?2.4:1);t.anisotropy=4;return t;
  }
  const floor=box(root,'#c9b59b',0,-.13,0,10,.25,8);
  floor.material=new T.MeshStandardMaterial({map:texture(roomId==='garage'?'floor':'wood'),roughness:.95}); floor.name='walk-floor';
  const divider=new T.Group();divider.userData.kind='divider';root.add(divider);
  const plaster=new T.MeshStandardMaterial({map:texture('wall'),roughness:1});
  for(const [x,z,w,d] of [[0,-4,10,.2],[-5,0,.2,8]]){
    if(integrated&&roomId==='living'&&z===-4){
      for(const side of [-1,1]){const m=box(divider,'#d9b58d',side*3,1.5,-4,4,3,.2);m.material=plaster;box(divider,'#a65d3e',side*3,3.02,-4,4,.12,.28);box(divider,'#826347',side*3,.12,-3.84,3.9,.2,.09);}
      // Open arch between the garage and living room; no lintel obscuring the view.
      continue;
    }
    if(integrated&&roomId==='bar'&&x===-5){
      for(const [center,length] of [[-1,6],[3.8,.4]]){box(root,'#d9b58d',-5,.5,center,.2,1,length);box(root,'#a65d3e',-5,1.04,center,.26,.10,length);}
      continue;
    }
    const wall=box(root,'#d9b58d',x,1.5,z,w,3,d);wall.material=plaster;
    box(root,'#a65d3e',x,3.02,z,w+.05,.12,d+.08);
    // Trim sits in front of the plaster, never on the same surface.
    box(root,'#826347',x===-5?-4.84:x,.12,z===-4?-3.84:z,x===-5?.09:9.8,.2,z===-4?.09:7.8);
  }
  if(!integrated||roomId!=='garage')for(let x=-4.8;x<5;x+=.42){box(root,'#b66d49',x,-.09,4,.4,.25,.18);}
  // Low cutaway wall keeps the dollhouse readable without hiding people.
  if(!integrated||roomId!=='living'){
    box(root,'#d3b18c',4.95,.24,.35,.18,.65,7.3);
    box(root,'#ac6545',4.95,.58,.35,.23,.08,7.3);
  }
  const rug=box(root,roomId==='living'?'#8b9373':'#884c40',-.5,.013,1.1,4.8,.02,3.2);
  if(roomId==='bar')rug.visible=false;
  if(roomId!=='bar'){
  for(const [w,d] of [[4.6,3],[4.35,2.75],[4.05,2.45]]){
    box(root,'#bfa072',-.5,.028,1.1-d/2,w,.012,.04);box(root,'#bfa072',-.5,.028,1.1+d/2,w,.012,.04);
    box(root,'#bfa072',-.5-w/2,.028,1.1,.04,.012,d);box(root,'#bfa072',-.5+w/2,.028,1.1,.04,.012,d);
  }
  rug.receiveShadow=true;
  for(let i=0;i<22;i++){const m=box(root,'#a97559',-.5+(i%6-.5)*.5-1,.035,.3+Math.floor(i/6)*.5,.12,.01,.12);m.rotation.y=Math.PI/4;}
  }
  function plant(x:number,z:number,size=1){
    const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);root.add(g);
    cylinder(g,'#a95935',0,.28,0,.30,.55);cylinder(g,'#503c26',0,.55,0,.26,.025);
    for(let i=0;i<9;i++){
      const angle=i*2.4;const leaf=ball(g,i%2?'#47633b':'#648044',Math.sin(angle)*.26,.8+random()*.55,Math.cos(angle)*.26,.11,.42,.045);
      leaf.rotation.set(Math.cos(angle)*.6,angle,Math.sin(angle)*.6);
      const stem=new T.Mesh(new T.CylinderGeometry(.012,.018,.7,5),material('#56603a'));stem.position.set(Math.sin(angle)*.1,.83,Math.cos(angle)*.1);g.add(stem);
    }
  }
  plants.forEach(([x,z])=>plant(x,z,1.1));
  // A recessed timber window adds depth to the otherwise quiet side wall.
  if(!integrated||roomId!=='bar'){
  box(root,'#604b36',-4.86,1.75,.5,.12,1.45,1.9);
  for(const z of [-.02,1.02])box(root,'#7b8c72',-4.77,1.75,z,.04,1.23,.87);
  for(const z of [-.46,.5,1.46])box(root,'#b08550',-4.72,1.75,z,.10,1.45,.08);
  for(const y of [1.03,1.75,2.47])box(root,'#b08550',-4.72,y,.5,.10,.08,1.98);
  box(root,'#9f7246',-4.63,1.01,.5,.38,.08,2.05);
  }
  // Record cabinet, individual vinyl spines, turntable and twin speakers.
  if(roomId!=='bar'){
  box(root,'#70432b',-3.6,.55,-3.4,2.25,1.1,.7);
  for(let i=0;i<28;i++)box(root,['#b18b53','#304a45','#a75c45','#d8ba8b'][i%4],-4.6+i*.068,.48,-3.02,.035,.65,.38);
  box(root,'#b9854b',-3.6,1.13,-3.4,2.4,.10,.85);
  box(root,'#272623',-3.6,1.23,-3.4,.85,.12,.6);cylinder(root,'#171919',-3.6,1.30,-3.4,.25,.02);cylinder(root,'#cf8b4c',-3.6,1.32,-3.4,.055,.01);
  for(const x of [-4.5,-1.65]){
    box(root,'#352f28',x,.95,-3.3,.66,1.9,.62);
    for(const y of [.55,1.27]){const cone=cylinder(root,'#151918',x,y,-2.965,.24,.055);cone.rotation.x=Math.PI/2;ball(root,'#454740',x,y,-2.92,.095,.095,.035);}
  }
  }
  function poster(x:number,text:string,color:string,flag=false){
    const c=document.createElement('canvas');c.width=256;c.height=320;const ctx=c.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,256,320);
    if(flag){ctx.fillStyle='#e2bd49';ctx.beginPath();ctx.moveTo(128,40);ctx.lineTo(232,160);ctx.lineTo(128,280);ctx.lineTo(24,160);ctx.fill();ctx.fillStyle='#294b70';ctx.beginPath();ctx.arc(128,160,61,0,7);ctx.fill();}
    else{ctx.fillStyle='#473125';ctx.textAlign='center';ctx.font='bold 30px Georgia';ctx.fillText(text,128,60);ctx.lineWidth=5;for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(128,190,30+i*14,0,7);ctx.strokeStyle='#754b36';ctx.stroke();}ctx.font='18px Georgia';ctx.fillText('DISQUE AMIZADE',128,295);}
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
    const parent=integrated&&roomId==='living'?divider:root;
    box(parent,'#6c482d',x,2.0,-3.85,.96,1.2,.055);
    const m=new T.Mesh(new T.PlaneGeometry(.86,1.1),new T.MeshStandardMaterial({map,roughness:1}));m.position.set(x,2,-3.81);parent.add(m);
  }
  if(roomId==='garage'){poster(-3.4,'BRASIL','#35704b',true);poster(-2.2,'LADO A','#d8a150');poster(.0,'BAILE','#c68151');}
  else if(roomId==='living'){poster(-3.4,'EM CASA','#b7bb92');poster(-2.2,'CAFÉ','#d8ae78');if(!integrated)poster(.0,'BOA PROSA','#c68151');}
  else{poster(1.7,'VINYL','#a2a578');poster(3.2,'LADO B','#d8ae78');}
  // Raised shutter and a small, intentionally stylized yellow car in the recess.
  if(roomId==='garage'){
  box(root,'#483e31',2.65,1.38,-3.86,3.1,2.7,.09);
  for(let i=0;i<7;i++)box(root,'#974731',2.65,2.35+i*.10,-3.7,3.25,.085,.17);
  box(root,'#b7aaa0',1.0,1.45,-3.7,.10,2.9,.17);box(root,'#b7aaa0',4.3,1.45,-3.7,.10,2.9,.17);
  const car=new T.Group();car.position.set(2.9,0,-3.15);root.add(car);
  box(car,'#bd8b38',0,.55,0,1.35,.65,1.25);box(car,'#d0a24b',0,.96,-.1,1.12,.58,.85);box(car,'#43554f',0,1.06,.34,.89,.33,.045);
  box(car,'#c3bbb0',0,.36,.65,1.45,.10,.12);
  for(const x of [-.5,.5]){ball(car,'#eee0b7',x,.63,.62,.14,.14,.05);const wheel=cylinder(car,'#282828',x*1.3,.29,0,.28,.19);wheel.rotation.z=Math.PI/2;}
  }else if(roomId==='living'){
    box(root,'#89633e',2.8,.47,-3.2,2.75,.94,.7);

    for(let i=0;i<18;i++)box(root,['#536953','#a26547','#d0b17d'][i%3],1.55+i*.14,.43,-2.83,.065,.6,.24);
    cylinder(root,'#6d5131',4,1.05,-3.2,.09,.35);ball(root,'#ecd4a3',4,1.4,-3.2,.24,.22,.24);
  }else{
    box(root,'#785035',-1.5,.55,-2.8,4,1.1,1);box(root,'#b3834c',-1.5,1.15,-2.8,4.2,.14,1.14);
    for(const y of [1.55,2.25]){
      box(root,'#6d472e',-2.3,y,-3.7,4.9,.1,.42);
      for(let i=0;i<16;i++){const x=-4.5+i*.29;cylinder(root,i%3?'#3f5a3b':'#98763a',x,y+.2,-3.63,.065,.3);cylinder(root,'#c7aa6c',x,y+.40,-3.63,.028,.13);}
    }
    for(const t of barTables){cylinder(root,'#825a38',t.x,1.08,t.z,.52,.10);cylinder(root,'#4d3c2d',t.x,.54,t.z,.09,1.02);cylinder(root,'#4d3c2d',t.x,.06,t.z,.32,.1);cylinder(root,'#efd19b',t.x,1.21,t.z,.06,.15);}
  }
  // Physical TVs are hit targets; the official video player opens outside the canvas.
  const tv=new T.Group();tv.userData.kind='television';root.add(tv);
  const tvSize=roomId==='living'?{w:1.85,h:1.14,x:2.8,y:1.58,z:-3.10}:{w:2.7,h:1.6,x:roomId==='garage'?2.65:2.55,y:roomId==='garage'?1.95:2.03,z:-3.55};
  const {w:tw,h:th,x:tx,y:ty,z:tz}=tvSize;tv.position.set(tx,ty,tz);
  box(tv,roomId==='living'?'#70462e':'#302d29',0,0,0,tw,th,.18);
  if(roomId==='garage'){
    box(tv,'#b6a385',0,th/2+.07,-.02,tw+.18,.12,.20);
    box(tv,'#726449',0,-th/2-.04,.02,tw+.08,.07,.1);
  }
  const display=document.createElement('canvas');display.width=640;display.height=360;
  const pen=display.getContext('2d')!;pen.fillStyle='#213f3c';pen.fillRect(0,0,640,360);
  pen.strokeStyle='#bfa478';pen.lineWidth=2;pen.strokeRect(24,24,592,312);
  pen.fillStyle='#f5dfb3';pen.textAlign='center';pen.font='18px sans-serif';pen.fillText('DISQUE AMIZADE APRESENTA',320,88);
  pen.font='italic 46px Georgia';pen.fillText(roomId==='garage'?'Cinema de garagem':roomId==='living'?'A TV da sala':'Na tela do Vinyl',320,171);
  pen.beginPath();pen.moveTo(306,216);pen.lineTo(306,258);pen.lineTo(344,237);pen.closePath();pen.fill();
  pen.font='17px sans-serif';pen.fillText('TOQUE PARA ESCOLHER UM VÍDEO',320,301);
  const tvTexture=new T.CanvasTexture(display);tvTexture.colorSpace=T.SRGBColorSpace;
  const television=new T.Mesh(new T.PlaneGeometry(tw-.18,th-.18),new T.MeshStandardMaterial({map:tvTexture,roughness:.6}));television.position.z=.101;television.name='television-screen';tv.add(television);
  if(roomId==='living')for(const x of [-.65,.65])box(tv,'#40382d',x,-th/2-.07,0,.11,.18,.24);
  furniture[roomId].forEach((f,group)=>{
    const {x,z,angle,color,count,stool}=f;
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);const w=count*.8+.2;
    g.userData={kind:'seat',indices:seats.map((s,i)=>s.group===group?i:-1).filter(i=>i>=0)};
    if(stool){cylinder(g,color,0,.71,0,.23,.10);for(const xx of [-.14,.14])for(const zz of [-.14,.14])box(g,'#57432e',xx,.34,zz,.045,.68,.045);return;}
    for(const xx of [-w/2+.1,w/2-.1])for(const zz of [-.3,.3])box(g,'#67472c',xx,.20,zz,.09,.40,.09);
    box(g,color,0,.43,0,w,.20,.82);box(g,color,0,.84,-.37,w,.76,.22);
    for(const xx of [-w/2,w/2])box(g,color,xx,.66,0,.14,.4,.85);
    for(let i=0;i<count;i++)box(g,color,(i-(count-1)/2)*.8,.58,.03,.74,.17,.66);
  });
  if(roomId!=='bar'){
    box(root,'#845c3c',-.55,.43,.85,1.22,.12,.86);for(const x of [-1,-.1])for(const z of [.55,1.15])box(root,'#57412e',x,.21,z,.075,.42,.075);
    cylinder(root,'#c0a574',-.55,.56,.85,.14,.13);
  }
  const telephoneGroups:T.Group[]=[];
  phones.forEach((p,index)=>{
    const g=new T.Group();g.position.set(p.x,0,p.z);root.add(g);
    for(const x of [-.26,.26])for(const z of [-.23,.23])box(g,'#725033',x,.39,z,.065,.78,.065);
    box(g,'#aa7a48',0,.81,0,.73,.11,.65);box(g,'#725033',0,.66,0,.65,.2,.57);box(g,'#ceaa65',0,.66,.30,.1,.025,.035);
    const phone=new T.Group();phone.position.y=.9;phone.userData={kind:'phone',index};g.add(phone);telephoneGroups.push(phone);
    box(phone,'#b7372b',0,.08,0,.48,.16,.4);
    const dial=cylinder(phone,'#efe0b7',0,.175,.035,.125,.02);
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;cylinder(phone,'#5c3427',Math.cos(a)*.085,.19,.035+Math.sin(a)*.085,.014,.008);}
    dial.receiveShadow=true;
    box(phone,'#d54432',0,.26,-.1,.54,.085,.12);for(const x of [-.22,.22])box(phone,'#be3029',x,.215,-.1,.13,.14,.15);
  });
  const wirePoints=[];
  for(let i=0;i<=24;i++)wirePoints.push(new T.Vector3(-4.8+i*.39,2.95-Math.sin(i/24*Math.PI)*.40,-3.45));
  root.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(wirePoints),48,.016,5,false),material('#3e342a')));
  const bulbs:T.Mesh[]=[];
  for(let i=1;i<24;i+=2){const pos=wirePoints[i];const bulb=ball(root,['#ec814d','#e5c568','#65a7a1','#cb624f'][i%4],pos.x,pos.y-.09,pos.z,.06,.085,.06);bulb.material=new T.MeshStandardMaterial({color:'#ffde95',emissive:['#ed6534','#eaa540','#428e76','#bf5646'][i%4],emissiveIntensity:2});bulbs.push(bulb);}
  const disco=new T.Mesh(new T.SphereGeometry(.4,20,12),new T.MeshStandardMaterial({color:'#c8bfae',metalness:.82,roughness:.25,flatShading:true}));disco.position.set(-.55,2.45,-1.9);root.add(disco);
  disco.visible=roomId==='garage';
  if(roomId==='garage')cylinder(root,'#463b30',-.55,2.95,-1.9,.012,.7);
  const lamp=new T.PointLight('#ffc67d',16,8,2);lamp.position.set(-3,2,-1.7);root.add(lamp);
  // Batch static furniture by material. Interactive meshes retain their hit targets.
  root.updateMatrixWorld(true);
  const batches=new Map<T.Material,T.Mesh[]>();
  const originals=new Set<T.BufferGeometry>();
  // Keep each interactive piece as one hit target while batching its own details.
  const interactive:T.Object3D[]=[];
  root.traverse(o=>{if(o.userData.kind)interactive.push(o);});
  for(const group of interactive){
    const local=new Map<T.Material,T.Mesh[]>();
    group.traverse(o=>{if(o instanceof T.Mesh&&!Array.isArray(o.material)){const list=local.get(o.material)||[];list.push(o);local.set(o.material,list);}});
    const inverse=group.matrixWorld.clone().invert();
    for(const [mat,meshes] of local){if(meshes.length<2)continue;
      const parts=meshes.map(m=>m.geometry.clone().applyMatrix4(inverse.clone().multiply(m.matrixWorld)));
      const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(!merged)continue;
      for(const old of meshes){originals.add(old.geometry);old.removeFromParent();}
      const mesh=new T.Mesh(merged,mat);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    }
  }
  root.traverse(o=>{
    if(!(o instanceof T.Mesh)||!o.visible||o===floor||o===disco||Array.isArray(o.material))return;
    let parent:T.Object3D|null=o;
    while(parent&&parent!==root){if(parent.userData.kind)return;parent=parent.parent;}
    const list=batches.get(o.material)||[];list.push(o);batches.set(o.material,list);
  });
  for(const [mat,meshes] of batches){
    if(meshes.length<2)continue;
    const parts=meshes.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld));
    const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());
    if(!merged)continue;
    const mesh=new T.Mesh(merged,mat);mesh.castShadow=true;mesh.receiveShadow=true;
    for(const old of meshes){originals.add(old.geometry);old.removeFromParent();}root.add(mesh);
  }
  // Restore the cutaway exterior walls/ceiling when viewing from inside the house.
  const interior=new T.Group();root.add(interior);interior.visible=false;
  box(interior,'#e5d1ae',0,3.2,0,10,.15,8);
  if(roomId!=='garage'){
    box(interior,'#d9b58d',0,1.5,4,10,3,.18);
    for(const x of [-2.5,2.5]){box(interior,'#926b42',x,1.9,3.86,1.8,1.4,.08);box(interior,'#81998a',x,1.9,3.80,1.6,1.2,.04);box(interior,'#bc975e',x,1.9,3.76,.06,1.2,.04);box(interior,'#bc975e',x,1.9,3.76,1.6,.06,.04);}
  }
  if(roomId!=='living')box(interior,'#d9b58d',4.95,1.85,.35,.18,2.4,7.3);
  interior.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=false;});
  const dividerMaterials=new Set<T.Material>(),dividerSources=new Set<T.Material>();
  divider.traverse(o=>{if(o instanceof T.Mesh){dividerSources.add(o.material as T.Material);o.material=(o.material as T.Material).clone();dividerMaterials.add(o.material);}});
  let cut=false;
  let caption='';
  function screenCaption(title?:string){
    const next=title??'';if(next===caption)return;caption=next;
    pen.fillStyle='#213f3c';pen.fillRect(32,122,576,77);pen.fillStyle='#f5dfb3';pen.textAlign='center';
    pen.font=title?'26px Georgia':'italic 46px Georgia';
    pen.fillText(title?(title.length>37?title.slice(0,36)+'…':title):roomId==='garage'?'Cinema de garagem':roomId==='living'?'A TV da sala':'Na tela do Vinyl',320,171,568);tvTexture.needsUpdate=true;
  }
  return {root,floor,television,screenCaption,cutaway:(enabled:boolean)=>{if(cut===enabled)return;cut=enabled;dividerMaterials.forEach(m=>{m.transparent=enabled;m.opacity=enabled?.16:1;m.depthWrite=!enabled;m.needsUpdate=true;});},screen:(on:boolean)=>{const mesh=root.getObjectByName('television-screen') as T.Mesh|undefined;if(mesh){const mat=mesh.material as T.MeshStandardMaterial;mat.emissive.set(on?'#4d9b83':'#000000');mat.emissiveIntensity=on?.7:0;}},phones:telephoneGroups,disco,interior,lights:(on:boolean)=>{lamp.intensity=on?16:0;bulbs.forEach(b=>(b.material as T.MeshStandardMaterial).emissiveIntensity=on?2:0);},dispose(){
    const geometries=new Set<T.BufferGeometry>(originals),mats=new Set<T.Material>(dividerSources),textures=new Set<T.Texture>();
    root.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);if(m.map)textures.add(m.map);}}});
    geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene.remove(root);
  }};
}
