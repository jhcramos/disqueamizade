import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { phones, furniture, seatsFor, barTables, plants, roomOffsets, roomAt, type RoomId } from './layout';
import { HOUSE_AREAS, WALLS, POOL } from './areas';

/** Cutaway house following the reference plan, with one root per stable presence channel. */
export function buildRoom(scene:T.Scene, roomId:RoomId='garage', _integrated=false) {
  const root=new T.Group();root.name=`house-plan-${roomId}`;scene.add(root);
  const offset=roomOffsets[roomId],seats=seatsFor(roomId);
  const cube=new RoundedBoxGeometry(1,1,1,2,.025),sphere=new T.SphereGeometry(1,10,7);
  const materials=new Map<string,T.MeshStandardMaterial>(),ownedGeometries=new Set<T.BufferGeometry>([cube,sphere]);
  const textures=new Set<T.Texture>();
  function material(color:string){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.83}));return materials.get(color)!;}
  function mesh(parent:T.Object3D,g:T.BufferGeometry,color:string,x:number,y:number,z:number){const m=new T.Mesh<T.BufferGeometry,T.Material>(g,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);ownedGeometries.add(g);return m;}
  function box(parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number){const m=mesh(parent,cube,color,x,y,z);m.scale.set(w,h,d);return m;}
  function ball(parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number){const m=mesh(parent,sphere,color,x,y,z);m.scale.set(w,h,d);return m;}
  function cylinder(parent:T.Object3D,color:string,x:number,y:number,z:number,r:number,h:number){return mesh(parent,new T.CylinderGeometry(r,r*.94,h,16),color,x,y,z);}
  function worldBox(color:string,x:number,y:number,z:number,w:number,h:number,d:number){return box(root,color,x-offset.x,y,z-offset.z,w,h,d);}
  function plant(x:number,z:number,size=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);root.add(g);cylinder(g,'#b58668',0,.3,0,.28,.6);cylinder(g,'#554835',0,.60,0,.25,.025);for(let i=0;i<7;i++){const a=i*2.4;const leaf=ball(g,i%2?'#526c51':'#7b9168',Math.sin(a)*.23,.95+(i%3)*.16,Math.cos(a)*.23,.12,.45,.055);leaf.rotation.set(Math.cos(a)*.5,a,Math.sin(a)*.5);}}
  function textPanel(parent:T.Object3D,title:string,subtitle:string,x:number,y:number,z:number,w=1.4,h=.55){
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=240;const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#f3ecdb';ctx.fillRect(0,0,640,240);ctx.fillStyle='#364d43';ctx.textAlign='center';ctx.font='34px Georgia';ctx.fillText(title,320,105,580);ctx.font='20px sans-serif';ctx.fillStyle='#937650';ctx.fillText(subtitle,320,160,580);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;textures.add(map);
    const face=mesh(parent,new T.PlaneGeometry(w,h),'#ffffff',x,y,z);face.material=new T.MeshStandardMaterial({map,roughness:1});return face;
  }
  let floor:T.Mesh|undefined;
  for(const area of HOUSE_AREAS.filter(a=>a.room===roomId)){
    const f=worldBox(area.floor,area.x,-.16,area.z,area.w,.3,area.d);f.name='walk-floor';floor??=f;
    // Light seams and edge bands make the floor finish legible from a distance.
    const timber=!area.outdoor&&area.id!=='garage'&&area.id!=='kitchen'&&area.id!=='hall';
    for(let x=area.x-area.w/2+.5;x<area.x+area.w/2;x+=timber?.55:1){worldBox(timber?'#bcaa91':'#c5c2b5',x,.003,area.z,.012,.006,area.d-.04);}
    if(!timber)for(let z=area.z-area.d/2+1;z<area.z+area.d/2;z++)worldBox('#c5c2b5',area.x,.005,z,area.w-.04,.006,.012);
  }
  const interior=new T.Group();root.add(interior);interior.visible=false;
  for(const wall of WALLS){const owner=roomAt({x:Math.min(11.8,Math.max(-11.8,wall.x)),z:Math.min(7.8,Math.max(-7.8,wall.z))})??'living';if(owner!==roomId)continue;
    const h=wall.h??1;worldBox('#e9dfc9',wall.x,h/2,wall.z,wall.w,h,wall.d);worldBox('#b8a584',wall.x,h+.025,wall.z,wall.w+.04,.05,wall.d+.04);
    if(h<2.5)box(interior,'#e9dfc9',wall.x-offset.x,(2.6+h)/2,wall.z-offset.z,wall.w,2.6-h,wall.d);
    // Baseboard is offset from plaster to avoid z-fighting.
    worldBox('#9caa9c',wall.x,.1,wall.z+.105,wall.w,.16,.04);
  }
  // Exterior elevations: pale weatherboards, dark window frames, a low brick plinth.
  if(roomId==='living'){
    for(const x of [.3,4.9,9.6]){
      worldBox('#34483e',x,1.8,-7.86,1.65,1.25,.12);worldBox('#a6beb1',x,1.8,-7.78,1.43,1.04,.055);
      worldBox('#f1e9d5',x,1.8,-7.73,.055,1.06,.035);worldBox('#f1e9d5',x,1.8,-7.72,1.43,.04,.035);
    }
    for(let z=-7.7;z<7.8;z+=.45)worldBox('#a98268',12,.16,z,.22,.3,.43);
  }
  plants.forEach(([x,z])=>plant(x,z,roomId==='bar'?.8:1));
  function rug(x:number,z:number,w:number,d:number,color:string){box(root,color,x,.018,z,w,.025,d);for(const sign of [-1,1]){box(root,'#dbcdb2',x+sign*(w/2-.12),.037,z,.035,.008,d-.22);box(root,'#dbcdb2',x,.038,z+sign*(d/2-.12),w-.22,.008,.035);}}
  if(roomId!=='bar')rug(-.55,.85,5.25,3.5,roomId==='living'?'#a8b19a':'#b98164');
  if(roomId==='garage'){
    // Music furniture stays in the garage; media room sits next door as in the plan.
    box(root,'#7f6246',-3.55,.6,-3.05,2.5,1.2,.72);box(root,'#d6b27d',-3.55,1.23,-3.05,2.6,.09,.8);
    for(let i=0;i<23;i++)box(root,['#647e77','#aa6955','#d5bc87'][i%3],-4.65+i*.095,.55,-2.67,.04,.72,.10);
    box(root,'#303530',-3.6,1.32,-3.05,.9,.09,.55);cylinder(root,'#1d2322',-3.6,1.38,-3.05,.23,.02);
    for(const x of [-4.5,-1.65]){box(root,'#363930',x,.85,-3.1,.58,1.7,.58);for(const y of [.5,1.15]){const cone=cylinder(root,'#191f1e',x,y,-2.79,.2,.045);cone.rotation.x=Math.PI/2;}}
    box(root,'#486457',2.8,.95,-3,2.8,1.9,.8);textPanel(root,'LADO A','MÚSICA & NOSTALGIA',2.8,2.15,-2.55,2.3,.7);
    // Framed front garage shutter, cut low so it does not cover visitors.
    for(let y=.12;y<.6;y+=.13)box(root,'#819489',0,y,3.92,8.6,.10,.08);
    rug(-7,1,3.35,3.2,'#6a8076');textPanel(root,'CINEMA EM CASA','FILMES · SÉRIES · CULTURA',-7,2.55,-3.7,2.7,.6);
  }else if(roomId==='living'){
    box(root,'#aa8460',2.8,.48,-3,2.8,.95,.8);
    for(let i=0;i<16;i++)box(root,['#d5b888','#62776e','#ad745e'][i%3],1.62+i*.15,.48,-2.56,.06,.6,.1);
    // Shelves behind the living sofas, with warm lamps.
    box(root,'#ae8c62',-3.55,.55,-3.1,2.2,1.1,.7);textPanel(root,'FIQUE À VONTADE','PAPO LIVRE',-3.55,1.7,-2.72,2.2,.6);
    for(const x of [-4.25,-2.85]){cylinder(root,'#6b6652',x,1.27,-3.05,.055,.30);ball(root,'#f3da9d',x,1.51,-3.05,.19,.19,.19);}
    for(const [x,title,sub,color]of [[7.3,'DESABAFA AQUI','CONVERSAR · ESCUTAR','#a7b49c'],[11.9,'TODAS AS CORES','PAQUERA LGBTQIA+','#bc9296'],[16.6,'BONS ENCONTROS','PAQUERA & NAMORO','#c3a288']] as const){
      rug(x,-1,3.9,3.8,color);cylinder(root,'#a17e58',x,.5,.6,.38,.07);cylinder(root,'#716b51',x,.24,.6,.065,.48);textPanel(root,title,sub,x,1.6,-3.76,3.0,.6);
    }
  }else{
    // L kitchen with an island, three breakfast stools and a full-height refrigerator.
    box(root,'#7b9280',-4.35,.49,.8,.7,.98,5.1);box(root,'#eee5cf',-4.35,1.01,.8,.82,.08,5.22);
    for(let z=-1.5;z<3;z+=.72){box(root,'#a8b9a5',-3.98,.49,z,.035,.73,.64);box(root,'#6e775f',-3.95,.73,z,.04,.035,.19);}
    box(root,'#839b84',-2.75,.52,-2.8,3,1.04,1);box(root,'#ede5cf',-2.75,1.07,-2.8,3.15,.08,1.12);
    box(root,'#c9cfc2',-4.25,1.07,3.15,.85,2.14,.83);box(root,'#eff0e3',-3.8,1.3,3.15,.04,1.5,.72);
    box(root,'#273b34',-4.32,1.07,.55,.55,.02,.85);for(const z of [.3,.8])cylinder(root,'#727a69',-4.32,1.095,z,.13,.015);
    textPanel(root,'COZINHA DA CASA','CAFÉ & HISTÓRIAS',-3,2,-3.73,2.75,.6);
    for(const [i,t]of barTables.entries()){
      const table=new T.Group();root.add(table);table.userData.kind=i===1?'poker':'table';
      if(i===1){box(table,'#aa8157',t.x,1.08,t.z,1.2,.12,1.22);box(table,'#3d715f',t.x,1.15,t.z,1.05,.025,1.08);for(const xx of [-.44,.44])for(const zz of [-.45,.45])box(table,'#766244',t.x+xx,.53,t.z+zz,.085,1.06,.085);
        for(let n=0;n<3;n++)box(table,'#ffefcf',t.x-.17+n*.17,1.173,t.z,.12,.006,.18);
        for(const side of [-1,1])for(let n=0;n<4;n++)cylinder(table,side<0?'#b7533b':'#d9c79b',t.x+side*.38,1.18+n*.013,t.z+.3,.045,.012);
      }else{cylinder(table,'#b39066',t.x,1.08,t.z,.49,.1);cylinder(table,'#746447',t.x,.52,t.z,.1,1.04);cylinder(table,'#746447',t.x,.08,t.z,.3,.12);}
    }
  }
  // Coffee table in living/music conversation circles.
  if(roomId!=='bar'){box(root,'#ae895b',-.55,.5,.85,1.25,.08,.9);for(const x of [-1.03,-.07])for(const z of [.52,1.18])box(root,'#867049',x,.24,z,.075,.48,.075);}
  furniture[roomId].forEach((f,group)=>{
    const g=new T.Group();g.position.set(f.x,0,f.z);g.rotation.y=f.angle;root.add(g);g.userData={kind:'seat',indices:seats.map((s,i)=>s.group===group?i:-1).filter(i=>i>=0)};
    if(f.stool){cylinder(g,f.color,0,.71,0,.24,.1);for(const xx of [-.16,.16])for(const zz of [-.16,.16])box(g,'#756449',xx,.34,zz,.05,.68,.05);box(g,f.color,0,1.02,-.2,.45,.45,.055);return;}
    const w=f.count*.8+.2;
    for(const xx of [-w/2+.13,w/2-.13])for(const zz of [-.28,.28])box(g,'#826848',xx,.23,zz,.075,.46,.075);
    box(g,'#aa9272',0,.46,0,w,.15,.84);box(g,f.color,0,.91,-.36,w,.8,.14);
    for(let i=0;i<f.count;i++){const x=(i-(f.count-1)/2)*.8;box(g,f.color,x,.61,.05,.76,.18,.64);box(g,f.color,x,.97,-.23,.75,.49,.14);}
    for(const x of [-w/2+.07,w/2-.07])box(g,'#b59c78',x,.72,.025,.14,.45,.84);
  });
  const telephoneGroups:T.Group[]=[];
  for(const [index,p]of phones.entries()){
    const table=new T.Group();table.position.set(p.x,0,p.z);root.add(table);table.userData.kind='phone';table.userData.index=index;
    box(table,'#c29f70',0,.88,0,.68,.1,.62);box(table,'#92794f',0,.7,0,.55,.28,.52);
    for(const x of [-.23,.23])for(const z of [-.2,.2])box(table,'#8a744d',x,.36,z,.06,.7,.06);
    const phone=new T.Group();phone.position.y=.96;phone.userData.kind='receiver';table.add(phone);telephoneGroups.push(phone);
    box(phone,'#c63b31',0,.09,0,.43,.18,.34);box(phone,'#ed6751',0,.23,-.04,.50,.10,.11);
    for(const x of [-.2,.2])box(phone,'#c2342c',x,.18,-.04,.1,.10,.15);
    const dial=cylinder(phone,'#f3d8a5',0,.19,.04,.115,.018);dial.rotation.x=.15;
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9;cylinder(phone,'#76382b',Math.sin(a)*.083,.207,.04+Math.cos(a)*.083,.012,.006);}
  }
  const tv=new T.Group();tv.userData.kind='television';root.add(tv);
  tv.position.set(roomId==='garage'?-7:roomId==='living'?2.8:2.7,1.8,roomId==='garage'?-3.6:-3.4);
  const tw=roomId==='living'?2.35:2.7,th=tw*9/16;
  box(tv,'#2e4338',0,0,0,tw+.12,th+.12,.14);
  const display=document.createElement('canvas');display.width=640;display.height=360;const pen=display.getContext('2d')!;
  const tvTexture=new T.CanvasTexture(display);tvTexture.colorSpace=T.SRGBColorSpace;textures.add(tvTexture);
  const television=mesh(tv,new T.PlaneGeometry(tw,th),'#ffffff',0,0,.08);television.name='television-screen';television.material=new T.MeshStandardMaterial({map:tvTexture,roughness:.65});
  let caption:string|undefined='initial';function screenCaption(title?:string){if(caption===title)return;caption=title;pen.fillStyle='#294e43';pen.fillRect(0,0,640,360);pen.strokeStyle='#c9b57c';pen.lineWidth=3;pen.strokeRect(22,22,596,316);pen.textAlign='center';pen.fillStyle='#efdfb6';pen.font='18px sans-serif';pen.fillText('DISQUE AMIZADE APRESENTA',320,78);pen.font='31px Georgia';pen.fillText(title?title.slice(0,42):'Aperte o play. Puxe assunto.',320,178,565);pen.font='16px sans-serif';pen.fillText('TOQUE PARA ESCOLHER UM VÍDEO',320,282);tvTexture.needsUpdate=true;}screenCaption();
  const disco=new T.Group();root.add(disco);disco.position.set(0,2.7,-1.9);disco.visible=roomId==='garage';const discoBall=mesh(disco,new T.SphereGeometry(.28,16,10),'#c4c5ad',0,0,0);(discoBall.material as T.MeshStandardMaterial).metalness=.7;
  const bulbs:T.Mesh[]=[];if(roomId==='garage')for(let i=0;i<9;i++){const b=ball(root,['#e19660','#80b9a5','#cf988b'][i%3],-4+i,2.55-Math.sin(i*Math.PI/8)*.32,-2.75,.055,.075,.055);b.material=(b.material as T.MeshStandardMaterial).clone();bulbs.push(b);}
  // Exterior pool deck and alfresco remain real walkable areas, not background art.
  let water:T.Mesh|undefined;let waterMaterial:T.ShaderMaterial|undefined;
  if(roomId==='living'){
    const local=(x:number,z:number)=>({x:x-offset.x,z:z-offset.z});
    const p=local(POOL.x,POOL.z);
    box(root,'#668e83',p.x,-.10,p.z,POOL.w,.12,POOL.d);
    waterMaterial=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv; uniform float time; void main(){float a=sin(vUv.x*70.+sin(vUv.y*18.+time)*1.4+time*.7);float b=sin(vUv.y*48.-time*.8+sin(vUv.x*22.));float light=pow(max(0.,a*b),8.);vec3 water=mix(vec3(.12,.43,.44),vec3(.32,.68,.65),vUv.y);gl_FragColor=vec4(water+light*.11,1.);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n}',side:T.DoubleSide});
    water=new T.Mesh(new T.PlaneGeometry(POOL.w-.12,POOL.d-.12),waterMaterial);water.rotation.x=-Math.PI/2;water.position.set(p.x,.025,p.z);water.name='pool-water';root.add(water);
    for(const sign of [-1,1]){box(root,'#f2e7cf',p.x+sign*(POOL.w/2+.07),.06,p.z,.22,.16,POOL.d+.4);box(root,'#f2e7cf',p.x,.06,p.z+sign*(POOL.d/2+.07),POOL.w+.36,.16,.22);}
    for(const x of [p.x-3.5,p.x+3.5]){box(root,'#d5ddd0',x,.33,p.z+.72,.035,.65,.035);box(root,'#d5ddd0',x+.27,.33,p.z+.72,.035,.65,.035);}
    // Glass boundary at the rear; a wide open passage joins deck and alfresco.
    for(let x=-15.8;x<=-4.2;x+=1.15){const q=local(x,-11.87);box(root,'#8b9b8c',q.x,.49,q.z,.035,.95,.035);}
    for(const [x,z]of [[-15.7,-7.7],[-12.3,-7.7],[-15.7,-.3],[-12.3,-.3]]){const q=local(x,z);box(root,'#f1e6d1',q.x,1.3,q.z,.12,2.6,.12);}
    for(const z of [-7.7,-.3]){const q=local(-14,z);box(root,'#b8996c',q.x,2.62,q.z,3.55,.12,.16);}
    for(let z=-7.4;z<-.4;z+=.68){const q=local(-14,z);box(root,'#c1a47e',q.x,2.70,q.z,3.7,.08,.055);}
    const t=local(-14,-3.1);box(root,'#b58f5b',t.x,.5,t.z,.8,.07,1.3);cylinder(root,'#756746',t.x,.24,t.z,.07,.48);
    for(const [x,z]of [[-15.5,-8.7],[-4.4,-8.5],[-15.6,-.65],[-12.4,-7.3]]){const q=local(x,z);plant(q.x,q.z,.8);}
    const lawn=worldBox('#9cac7c',-2,-.42,-2,33,.15,25);lawn.name='landscape-base';
  }
  // Merge stationary geometry per material and per hit target, preserving all interactions.
  root.updateMatrixWorld(true);
  const targets=[root,...root.children.filter(o=>o.userData.kind==='seat'||o.userData.kind==='phone'),...telephoneGroups];
  for(const group of targets){const batches=new Map<T.Material,T.Mesh[]>();group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert();
    group.traverse(o=>{if(!(o instanceof T.Mesh)||Array.isArray(o.material)||o===water||o===television||o===discoBall||bulbs.includes(o)||o===floor||o.parent===interior)return;let parent:T.Object3D|null=o.parent;while(parent&&parent!==group){if(parent.userData.kind||parent===interior||parent===disco)return;parent=parent.parent;}if(parent!==group)return;const list=batches.get(o.material)??[];list.push(o);batches.set(o.material,list);});
    for(const[mat,meshes]of batches){if(meshes.length<2)continue;const parts=meshes.map(m=>{const source=m.geometry.clone();const g=source.index?source.toNonIndexed():source;if(g!==source)source.dispose();return g.applyMatrix4(inverse.clone().multiply(m.matrixWorld));});const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(!geometry)continue;meshes.forEach(m=>m.removeFromParent());const merged=mesh(group,geometry,'#ffffff',0,0,0);merged.material=mat;}
  }
  return{root,floor:floor!,television,screenCaption,cutaway:(on:boolean)=>{tv.visible=!on;},phones:telephoneGroups,disco,interior,
    update:(time:number,reduced:boolean)=>{if(waterMaterial)waterMaterial.uniforms.time.value=reduced?0:time*.00045;},
    screen:(on:boolean)=>{const m=television.material as T.MeshStandardMaterial;m.emissive.set(on?'#446c51':'#000000');m.emissiveIntensity=on?.4:0;},
    lights:(on:boolean)=>bulbs.forEach(b=>{const m=b.material as T.MeshStandardMaterial;m.emissive.copy(m.color);m.emissiveIntensity=on?1.2:0;}),
    dispose(){const mats=new Set<T.Material>(materials.values());root.traverse(o=>{if(o instanceof T.Mesh){ownedGeometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});ownedGeometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene.remove(root);},
  };
}
