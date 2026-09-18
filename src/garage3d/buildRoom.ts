import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { phones, seats } from './layout';

export function buildRoom(scene:T.Scene) {
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
  function texture(kind:'floor'|'wall'){
    const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d')!;
    ctx.fillStyle=kind==='floor'?'#c9b59b':'#d9b58d';ctx.fillRect(0,0,512,512);
    const colors=kind==='floor'?['#7d6958','#eee4cd','#ac7157','#657574','#b79a7b']:['#cfaa81','#e6caa5','#c9a47b'];
    for(let i=0;i<(kind==='floor'?2600:14000);i++){
      const x=random()*512,y=random()*512,s=kind==='floor'?1+random()*4:random()*2;
      ctx.fillStyle=colors[Math.floor(random()*colors.length)];ctx.globalAlpha=kind==='floor'?.8:.25;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+s,y+1);ctx.lineTo(x+s*.7,y+s);ctx.lineTo(x-1,y+s*.6);ctx.fill();
    }
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='floor'?3:2,kind==='floor'?2.4:1);t.anisotropy=4;return t;
  }
  const floor=box(root,'#c9b59b',0,-.13,0,10,.25,8);
  floor.material=new T.MeshStandardMaterial({map:texture('floor'),roughness:.95}); floor.name='walk-floor';
  const plaster=new T.MeshStandardMaterial({map:texture('wall'),roughness:1});
  for(const [x,z,w,d] of [[0,-4,10,.2],[-5,0,.2,8]]){
    const wall=box(root,'#d9b58d',x,1.5,z,w,3,d);wall.material=plaster;
    box(root,'#a65d3e',x,3.02,z,w+.05,.12,d+.08);
    box(root,'#826347',x,.12,z+.025,w,.2,d+.04);
  }
  for(let x=-4.8;x<5;x+=.42){box(root,'#b66d49',x,-.09,4,.4,.25,.18);}
  // Low cutaway wall keeps the dollhouse readable without hiding people.
  box(root,'#d3b18c',4.95,.24,.35,.18,.65,7.3);
  box(root,'#ac6545',4.95,.58,.35,.23,.08,7.3);
  const rug=box(root,'#884c40',-.5,.013,1.1,4.8,.02,3.2);
  for(const [w,d] of [[4.6,3],[4.35,2.75],[4.05,2.45]]){
    box(root,'#bfa072',-.5,.028,1.1-d/2,w,.012,.04);box(root,'#bfa072',-.5,.028,1.1+d/2,w,.012,.04);
    box(root,'#bfa072',-.5-w/2,.028,1.1,.04,.012,d);box(root,'#bfa072',-.5+w/2,.028,1.1,.04,.012,d);
  }
  rug.receiveShadow=true;
  for(let i=0;i<22;i++){const m=box(root,'#a97559',-.5+(i%6-.5)*.5-1,.035,.3+Math.floor(i/6)*.5,.12,.01,.12);m.rotation.y=Math.PI/4;}
  function plant(x:number,z:number,size=1){
    const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);root.add(g);
    cylinder(g,'#a95935',0,.28,0,.30,.55);cylinder(g,'#503c26',0,.55,0,.26,.025);
    for(let i=0;i<9;i++){
      const angle=i*2.4;const leaf=ball(g,i%2?'#47633b':'#648044',Math.sin(angle)*.26,.8+random()*.55,Math.cos(angle)*.26,.11,.42,.045);
      leaf.rotation.set(Math.cos(angle)*.6,angle,Math.sin(angle)*.6);
      const stem=new T.Mesh(new T.CylinderGeometry(.012,.018,.7,5),material('#56603a'));stem.position.set(Math.sin(angle)*.1,.83,Math.cos(angle)*.1);g.add(stem);
    }
  }
  plant(-4.25,-.9,1.25);plant(-4.1,3.15,1);plant(4,-2.3,1.25);plant(4,2.7,1.1);plant(-.85,-3.4,.8);
  // A recessed timber window adds depth to the otherwise quiet side wall.
  box(root,'#604b36',-4.86,1.75,.5,.12,1.45,1.9);
  for(const z of [-.02,1.02])box(root,'#7b8c72',-4.77,1.75,z,.04,1.23,.87);
  for(const z of [-.46,.5,1.46])box(root,'#b08550',-4.72,1.75,z,.10,1.45,.08);
  for(const y of [1.03,1.75,2.47])box(root,'#b08550',-4.72,y,.5,.10,.08,1.98);
  box(root,'#9f7246',-4.63,1.01,.5,.38,.08,2.05);
  // Record cabinet, individual vinyl spines, turntable and twin speakers.
  box(root,'#70432b',-3.6,.55,-3.4,2.25,1.1,.7);
  for(let i=0;i<28;i++)box(root,['#b18b53','#304a45','#a75c45','#d8ba8b'][i%4],-4.6+i*.068,.48,-3.02,.035,.65,.38);
  box(root,'#b9854b',-3.6,1.13,-3.4,2.4,.10,.85);
  box(root,'#272623',-3.6,1.23,-3.4,.85,.12,.6);cylinder(root,'#171919',-3.6,1.30,-3.4,.25,.02);cylinder(root,'#cf8b4c',-3.6,1.32,-3.4,.055,.01);
  for(const x of [-4.5,-1.65]){
    box(root,'#352f28',x,.95,-3.3,.66,1.9,.62);
    for(const y of [.55,1.27]){const cone=cylinder(root,'#151918',x,y,-2.965,.24,.055);cone.rotation.x=Math.PI/2;ball(root,'#454740',x,y,-2.92,.095,.095,.035);}
  }
  function poster(x:number,text:string,color:string,flag=false){
    const c=document.createElement('canvas');c.width=256;c.height=320;const ctx=c.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,256,320);
    if(flag){ctx.fillStyle='#e2bd49';ctx.beginPath();ctx.moveTo(128,40);ctx.lineTo(232,160);ctx.lineTo(128,280);ctx.lineTo(24,160);ctx.fill();ctx.fillStyle='#294b70';ctx.beginPath();ctx.arc(128,160,61,0,7);ctx.fill();}
    else{ctx.fillStyle='#473125';ctx.textAlign='center';ctx.font='bold 30px Georgia';ctx.fillText(text,128,60);ctx.lineWidth=5;for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(128,190,30+i*14,0,7);ctx.strokeStyle='#754b36';ctx.stroke();}ctx.font='18px Georgia';ctx.fillText('DISQUE AMIZADE',128,295);}
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
    box(root,'#6c482d',x,2.0,-3.85,.96,1.2,.055);
    const m=new T.Mesh(new T.PlaneGeometry(.86,1.1),new T.MeshStandardMaterial({map,roughness:1}));m.position.set(x,2,-3.81);root.add(m);
  }
  poster(-3.4,'BRASIL','#35704b',true);poster(-2.2,'LADO A','#d8a150');poster(.0,'BAILE','#c68151');
  // Raised shutter and a small, intentionally stylized yellow car in the recess.
  box(root,'#483e31',2.65,1.38,-3.86,3.1,2.7,.09);
  for(let i=0;i<7;i++)box(root,'#974731',2.65,2.35+i*.10,-3.7,3.25,.085,.17);
  box(root,'#b7aaa0',1.0,1.45,-3.7,.10,2.9,.17);box(root,'#b7aaa0',4.3,1.45,-3.7,.10,2.9,.17);
  const car=new T.Group();car.position.set(2.9,0,-3.15);root.add(car);
  box(car,'#bd8b38',0,.55,0,1.35,.65,1.25);box(car,'#d0a24b',0,.96,-.1,1.12,.58,.85);box(car,'#43554f',0,1.06,.34,.89,.33,.045);
  box(car,'#c3bbb0',0,.36,.65,1.45,.10,.12);
  for(const x of [-.5,.5]){ball(car,'#eee0b7',x,.63,.62,.14,.14,.05);const wheel=cylinder(car,'#282828',x*1.3,.29,0,.28,.19);wheel.rotation.z=Math.PI/2;}
  function seatFurniture(x:number,z:number,angle:number,color:string,wide=false){
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);const w=wide?1.9:.85;
    for(const xx of [-w/2+.1,w/2-.1])for(const zz of [-.3,.3])box(g,'#67472c',xx,.20,zz,.09,.40,.09);
    box(g,color,0,.43,0,w,.20,.82);box(g,color,0,.84,-.37,w,.76,.22);
    for(const xx of [-w/2,w/2])box(g,color,xx,.66,0,.14,.4,.85);
    for(let i=0;i<(wide?2:1);i++)box(g,color,wide?(i-.5)*.88:0,.58,.03,wide?.85:.68,.17,.66);
    g.userData={kind:'seat',index:wide?0:seats.findIndex(s=>s.x===x&&s.z===z)};
  }
  seatFurniture(-2.7,1.1,Math.PI/2,'#b77d55',true);
  seatFurniture(1.7,.7,-Math.PI/2,'#647557');seatFurniture(1.7,1.7,-Math.PI/2,'#b08350');
  box(root,'#845c3c',-.55,.43,1.2,1.22,.12,.86);for(const x of [-1,-.1])for(const z of [.9,1.5])box(root,'#57412e',x,.21,z,.075,.42,.075);
  cylinder(root,'#c0a574',-.55,.56,1.2,.14,.13);
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
  cylinder(root,'#463b30',-.55,2.95,-1.9,.012,.7);
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
    if(!(o instanceof T.Mesh)||o===floor||o===disco||Array.isArray(o.material))return;
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
  return {root,floor,phones:telephoneGroups,disco,lights:(on:boolean)=>{lamp.intensity=on?16:0;bulbs.forEach(b=>(b.material as T.MeshStandardMaterial).emissiveIntensity=on?2:0);},dispose(){
    const geometries=new Set<T.BufferGeometry>(originals),mats=new Set<T.Material>(),textures=new Set<T.Texture>();
    root.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);if(m.map)textures.add(m.map);}}});
    geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene.remove(root);
  }};
}
