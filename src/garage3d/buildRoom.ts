import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { phonesFor, furniture, seatsFor, barTables, plantsFor, roomOffsets, type RoomId } from './layout';
import { HOUSE_AREAS, WALLS, OPENINGS, FIXTURES, POOL, areaById, planPoint, planRect } from './areas';

/** Measured house geometry. Every channel root uses the same plan coordinates. */
export function buildRoom(scene:T.Scene, roomId:RoomId='garage', _integrated=false) {
  const root=new T.Group();root.name=`house-plan-${roomId}`;scene.add(root);
  const offset=roomOffsets[roomId],seats=seatsFor(roomId);
  const cube=new RoundedBoxGeometry(1,1,1,2,.025),sharp=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,10,7);
  const materials=new Map<string,T.MeshStandardMaterial>(),ownedGeometries=new Set<T.BufferGeometry>([cube,sharp,sphere]);
  const textures=new Set<T.Texture>();
  const local=(x:number,z:number)=>({x:x-offset.x,z:z-offset.z});
  function material(color:string){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.83}));return materials.get(color)!;}
  function mesh(parent:T.Object3D,g:T.BufferGeometry,color:string,x:number,y:number,z:number){const m=new T.Mesh<T.BufferGeometry,T.Material>(g,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);ownedGeometries.add(g);return m;}
  function box(parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number){const m=mesh(parent,Math.min(w,h,d)<.065?sharp:cube,color,x,y,z);m.scale.set(w,h,d);return m;}
  function ball(parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number){const m=mesh(parent,sphere,color,x,y,z);m.scale.set(w,h,d);return m;}
  function cylinder(parent:T.Object3D,color:string,x:number,y:number,z:number,r:number,h:number){return mesh(parent,new T.CylinderGeometry(r,r*.94,h,16),color,x,y,z);}
  function worldBox(color:string,x:number,y:number,z:number,w:number,h:number,d:number,parent:T.Object3D=root){return box(parent,color,x-offset.x,y,z-offset.z,w,h,d);}
  function plant(x:number,z:number,size=.7){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);root.add(g);cylinder(g,'#b58668',0,.3,0,.28,.6);cylinder(g,'#554835',0,.60,0,.25,.025);for(let i=0;i<7;i++){const a=i*2.4;const leaf=ball(g,i%2?'#526c51':'#7b9168',Math.sin(a)*.23,.95+(i%3)*.16,Math.cos(a)*.23,.12,.45,.055);leaf.rotation.set(Math.cos(a)*.5,a,Math.sin(a)*.5);}}
  function rug(x:number,z:number,w:number,d:number,color:string){worldBox(color,x,.022,z,w,.025,d);for(const sign of [-1,1]){worldBox('#dbcdb2',x+sign*(w/2-.10),.038,z,.025,.007,d-.18);worldBox('#dbcdb2',x,.039,z+sign*(d/2-.10),w-.18,.007,.025);}}

  let floor:T.Mesh|undefined;
  for(const area of HOUSE_AREAS.filter(a=>a.room===roomId)){
    const f=worldBox(area.floor,area.x,-.16,area.z,area.w,.3,area.d);f.name='walk-floor';floor??=f;
    const carpet=['quiet','pride','dating','games','media','wir1','wir3'].includes(area.id);
    if(carpet){worldBox(area.floor,area.x,.004,area.z,area.w-.04,.012,area.d-.04);continue;}
    const paving=area.outdoor,step=paving?.8:.6,seam=paving?'#bdb6a6':'#c3bcab';
    for(let x=area.x-area.w/2+step;x<area.x+area.w/2-.02;x+=step)worldBox(seam,x,.006,area.z,.009,.008,area.d-.04);
    for(let z=area.z-area.d/2+step;z<area.z+area.d/2-.02;z+=step)worldBox(seam,area.x,.007,z,area.w-.04,.008,.009);
  }
  const interior=new T.Group();interior.name='full-height-interior';root.add(interior);interior.visible=false;
  for(const wall of WALLS.filter(w=>w.room===roomId)){
    const h=wall.h,color=wall.exterior?'#eee7d8':'#e8dfcc';
    worldBox(color,wall.x,h/2,wall.z,wall.w,h,wall.d);
    worldBox('#bcaa8e',wall.x,h+.018,wall.z,wall.w+.025,.036,wall.d+.025);
    const isWindowSill=OPENINGS.some(o=>o.kind==='window'&&o.room===roomId&&Math.abs(o.x-wall.x)<.001&&Math.abs(o.z-wall.z)<.001);
    if(!isWindowSill)worldBox(color,wall.x,(2.6+h)/2,wall.z,wall.w,2.6-h,wall.d,interior);
    const horizontal=wall.w>wall.d;
    for(const side of [-1,1])worldBox('#c9bfab',wall.x+(horizontal?0:side*(wall.w/2+.012)),.07,wall.z+(horizontal?side*(wall.d/2+.012):0),horizontal?wall.w:.025,.12,horizontal?.025:wall.d);
  }
  // The same gaps that split the collision walls also define every frame and threshold.
  for(const opening of OPENINGS.filter(o=>o.room===roomId)){
    const horizontal=opening.axis==='x',width=horizontal?opening.w:opening.d;
    const at=(u:number)=>({x:opening.x+(horizontal?u:0),z:opening.z+(horizontal?0:u)});
    const member=(parent:T.Object3D,u:number,y:number,length:number,height:number,color:string,depth=.09)=>{const p=at(u);return worldBox(color,p.x,y,p.z,horizontal?length:depth,height,horizontal?depth:length,parent);};
    const frame=opening.kind==='window'?'#586e64':'#ac9878';
    if(opening.kind==='window'){
      member(root,0,.61,width+.08,.06,frame,.15);
      for(const u of [-width/2,width/2])member(interior,u,1.40,.055,1.54,frame);
      member(interior,0,2.14,width+.08,.055,frame);member(interior,0,1.37,.035,1.48,frame,.045);
      const glass=member(interior,0,1.39,width-.08,1.43,'#aac7be',.026);glass.material=new T.MeshStandardMaterial({color:'#aac7be',transparent:true,opacity:.35,roughness:.15});glass.castShadow=false;
      member(interior,0,2.40,width,.40,'#eee7d8',horizontal?opening.d:opening.w);
    }else if(opening.kind==='garage'){
      // Raised sectional door and tracks are on the measured east elevation.
      for(const u of [-width/2,width/2]){member(root,u,.39,.075,.78,frame,.16);member(interior,u,1.60,.075,1.64,frame,.16);}
      member(interior,0,2.47,width+.10,.18,'#83938b',.18);
      const inside=opening.x-.65;
      for(let x=inside-.52;x<opening.x-.08;x+=.16)worldBox('#a1aba2',x,2.43,opening.z,.13,.055,width-.1,interior);
      worldBox('#a7a596',opening.x,.014,opening.z,.20,.026,width);
    }else{
      for(const u of [-width/2,width/2]){member(root,u,.39,.045,.78,frame);member(interior,u,1.48,.045,1.40,frame);}
      member(interior,0,2.20,width+.06,.07,frame);member(interior,0,2.42,width,.35,'#e8dfcc',horizontal?opening.d:opening.w);
      member(root,0,.012,width,.022,'#b9ad97',.13);
    }
  }

  // Fixed cabinetry and plumbing use the exact footprints used for walking collisions.
  for(const fixture of FIXTURES.filter(f=>f.room===roomId)){
    const g=new T.Group();g.name=`fixture-${fixture.kind}`;g.position.set(fixture.x-offset.x,0,fixture.z-offset.z);root.add(g);
    const {w,d,h}=fixture;
    const stone='#f1eee3',cabinet='#b5b29a',metal='#8e9e97',ceramic='#f4f2e8';
    const faucet=(x:number,y:number,z:number)=>{cylinder(g,metal,x,y+.09,z,.022,.18);box(g,metal,x,y+.17,z+.045,.045,.035,.13);};
    if(fixture.kind==='wardrobe'){
      box(g,'#b0a28b',0,h/2,0,w,h,d);box(g,'#d2c5ac',0,h+.025,0,w+.025,.05,d+.025);
      const across=w>d,n=Math.max(2,Math.round((across?w:d)/.5));
      for(let i=0;i<n;i++){const p=((i+.5)/n-.5)*(across?w:d);if(across){box(g,'#dfd6c0',p,h*.51,d/2+.008,w/n-.025,h-.12,.025);box(g,'#8b927e',p+.045,h*.54,d/2+.03,.025,.14,.025);}else{box(g,'#dfd6c0',w/2+.008,h*.51,p,.025,h-.12,d/n-.025);box(g,'#8b927e',w/2+.03,h*.54,p+.045,.025,.14,.025);}}
    }else if(fixture.kind==='counter'||fixture.kind==='island'){
      box(g,cabinet,0,h/2,0,w,h-.04,d);box(g,stone,0,h-.025,0,w+.025,.065,d+.025);
      const n=Math.max(1,Math.round(w/.55));for(let i=0;i<n;i++){const x=((i+.5)/n-.5)*w;box(g,'#cbc6ae',x,h*.50,-d/2-.006,w/n-.022,h-.12,.022);box(g,'#717d69',x,h*.72,-d/2-.023,.16,.025,.028);}
      if(fixture.kind==='island'){
        const sinkX=w*.22,sinkW=Math.min(.66,w*.34);box(g,metal,sinkX,h+.014,0,sinkW,.025,d*.7);box(g,'#7d948a',sinkX,h+.031,0,sinkW-.055,.018,d*.7-.055);faucet(sinkX,h+.04,-d*.35);
        box(g,'#e0ddd0',-w*.22,h*.5,-d/2-.024,Math.min(.52,w*.35),h-.16,.028);box(g,'#92988a',-w*.22,h*.82,-d/2-.045,.35,.035,.025);
      }else if(fixture.w>2.5){
        box(g,'#35443c',0,h+.014,0,.77,.025,d*.79);for(const x of [-.19,.19])for(const z of [-d*.19,d*.19]){cylinder(g,'#171f1b',x,h+.035,z,.115,.023);cylinder(g,'#7c8274',x,h+.05,z,.074,.01);}
      }
    }else if(fixture.kind==='desk'){
      box(g,'#c7ad7d',0,h-.035,0,w,.07,d);for(const x of [-w/2+.05,w/2-.05])box(g,'#9d8968',x,h/2,0,.07,h,d-.06);
      box(g,'#526960',w*.18,h+.23,-d*.15,.48,.38,.04);box(g,'#bacac1',w*.18,h+.235,-d*.15+.024,.42,.31,.008);box(g,'#f3eed9',-w*.24,h+.015,.015,.33,.025,.25);
    }else if(fixture.kind==='bath'){
      box(g,ceramic,0,h/2,0,w,h,d);box(g,'#b8cfc7',0,h+.01,0,w-.14,.025,d-.13);box(g,'#d9e2d6',0,h+.026,0,w-.23,.018,d-.22);faucet(-w*.34,h,-d*.30);
    }else if(fixture.kind==='shower'){
      box(g,ceramic,0,h/2,0,w,h,d);box(g,'#c0c9c0',0,h+.01,0,w-.09,.018,d-.09);cylinder(g,'#77877c',w*.26,h+.026,d*.24,.055,.009);
      const glass=new T.MeshStandardMaterial({color:'#bcd2c7',transparent:true,opacity:.22,roughness:.12});
      const rear=box(g,'#bcd2c7',0,.83,-d/2+.025,w,1.58,.025);rear.material=glass;rear.castShadow=false;
      const side=box(g,'#bcd2c7',w/2-.025,.83,0,.025,1.58,d);side.material=glass;side.castShadow=false;
      box(g,metal,0,1.06,-d/2+.06,.025,.74,.035);box(g,metal,0,1.43,-d/2+.14,.16,.035,.21);
    }else if(fixture.kind==='toilet'){
      box(g,ceramic,0,h*.72,-d*.28,w*.80,h*.8,d*.30);ball(g,ceramic,0,h*.40,d*.07,w*.43,h*.46,d*.40);ball(g,'#d0d9cd',0,h*.82,d*.1,w*.32,.035,d*.29);ball(g,ceramic,0,h*.84,d*.1,w*.22,.036,d*.21);box(g,metal,w*.18,h*1.11,-d*.27,.075,.025,.035);
    }else if(fixture.kind==='basin'){
      box(g,'#b7b29b',0,h/2,0,w,h-.035,d);box(g,stone,0,h,0,w+.025,.07,d+.025);
      const count=w>1.1?2:1;for(let i=0;i<count;i++){const x=(i-(count-1)/2)*w*.48;ball(g,ceramic,x,h+.028,0,w/(count*2)-.035,.055,d*.36);ball(g,'#a9bfb4',x,h+.07,0,w/(count*2)-.09,.018,d*.24);faucet(x,h+.02,-d*.36);}
    }else if(fixture.kind==='washer'){
      box(g,'#eeeede',0,h/2,0,w,h,d);const door=cylinder(g,'#acb5a8',0,h*.43,d/2+.01,Math.min(w*.37,h*.3),.035);door.rotation.x=Math.PI/2;const glass=cylinder(g,'#566e63',0,h*.43,d/2+.036,Math.min(w*.28,h*.23),.018);glass.rotation.x=Math.PI/2;box(g,'#bcc4b4',0,h*.86,d/2+.01,w*.85,.09,.025);
    }else if(fixture.kind==='fridge'){
      box(g,'#c7d0c3',0,h/2,0,w,h,d);box(g,'#e0e4d6',0,h*.66,-d/2-.015,w-.05,h*.62,.035);box(g,'#d6dece',0,h*.18,-d/2-.015,w-.05,h*.29,.035);box(g,metal,w*.29,h*.6,-d/2-.049,.028,h*.27,.025);
    }
  }
  plantsFor(roomId).forEach(([x,z])=>plant(x,z));
  for(const id of roomId==='living'?['living','quiet','pride','dating'] as const:roomId==='garage'?['media'] as const:['games'] as const){const a=areaById(id);rug(a.x,a.z,Math.min(a.w*.79,3.3),a.d*.62,id==='pride'?'#b59596':id==='media'?'#788a7d':'#bfae8e');}

  if(roomId==='bar')for(const [i,t]of barTables.entries()){
    const table=new T.Group();root.add(table);table.userData.kind=i===1?'poker':'table';
    if(i===1){box(table,'#aa8157',t.x,.84,t.z,.94,.10,.95);box(table,'#3d715f',t.x,.90,t.z,.82,.025,.84);for(const xx of [-.34,.34])for(const zz of [-.35,.35])box(table,'#766244',t.x+xx,.40,t.z+zz,.075,.80,.075);for(let n=0;n<3;n++)box(table,'#ffefcf',t.x-.17+n*.17,.923,t.z,.12,.006,.18);for(const side of [-1,1])for(let n=0;n<4;n++)cylinder(table,side<0?'#b7533b':'#d9c79b',t.x+side*.30,.93+n*.013,t.z+.26,.045,.012);
    }else{box(table,'#b39066',t.x,.84,t.z,.77,.09,.77);cylinder(table,'#746447',t.x,.40,t.z,.08,.80);cylinder(table,'#746447',t.x,.06,t.z,.29,.10);for(let x=0;x<4;x++)for(let z=0;z<4;z++){box(table,(x+z)%2?'#cebd97':'#6f8067',t.x-.24+x*.16,.891,t.z-.24+z*.16,.15,.01,.15);}}
  }
  furniture[roomId].forEach((f,group)=>{
    const g=new T.Group();g.position.set(f.x,0,f.z);g.rotation.y=f.angle;g.scale.setScalar(f.scale??1);root.add(g);g.userData={kind:'seat',indices:seats.map((s,i)=>s.group===group?i:-1).filter(i=>i>=0)};
    if(f.stool){cylinder(g,f.color,0,.71,0,.24,.1);for(const xx of [-.16,.16])for(const zz of [-.16,.16])box(g,'#756449',xx,.34,zz,.05,.68,.05);box(g,f.color,0,1.02,-.2,.45,.45,.055);return;}
    const w=f.count*.8+.2;
    for(const xx of [-w/2+.13,w/2-.13])for(const zz of [-.28,.28])box(g,'#826848',xx,.23,zz,.075,.46,.075);
    box(g,'#aa9272',0,.46,0,w,.15,.84);box(g,f.color,0,.91,-.36,w,.8,.14);
    for(let i=0;i<f.count;i++){const x=(i-(f.count-1)/2)*.8;box(g,f.color,x,.61,.05,.76,.18,.64);box(g,f.color,x,.97,-.23,.75,.49,.14);}
    for(const x of [-w/2+.07,w/2-.07])box(g,'#b59c78',x,.72,.025,.14,.45,.84);
  });
  const telephoneGroups:T.Group[]=[];
  for(const [index,p]of phonesFor(roomId).entries()){
    const table=new T.Group();table.position.set(p.x,0,p.z);root.add(table);table.userData.kind='phone';table.userData.index=index;
    box(table,'#c29f70',0,.75,0,.60,.08,.55);box(table,'#92794f',0,.6,0,.51,.24,.47);
    for(const x of [-.21,.21])for(const z of [-.18,.18])box(table,'#8a744d',x,.30,z,.055,.60,.055);
    const phone=new T.Group();phone.position.y=.83;phone.userData.kind='receiver';table.add(phone);telephoneGroups.push(phone);
    box(phone,'#c63b31',0,.09,0,.43,.18,.34);box(phone,'#ed6751',0,.23,-.04,.50,.10,.11);for(const x of [-.2,.2])box(phone,'#c2342c',x,.18,-.04,.1,.10,.15);
    const dial=cylinder(phone,'#f3d8a5',0,.19,.04,.115,.018);dial.rotation.x=.15;for(let i=0;i<9;i++){const a=i*Math.PI*2/9;cylinder(phone,'#76382b',Math.sin(a)*.083,.207,.04+Math.cos(a)*.083,.012,.006);}
  }

  const tvArea=areaById(roomId==='garage'?'media':roomId==='living'?'living':'dining');
  const tv=new T.Group();tv.userData.kind='television';root.add(tv);tv.position.set(tvArea.x-offset.x,1.72,tvArea.z-tvArea.d/2+.20-offset.z);
  const tw=Math.min(2.2,tvArea.w*.67),th=tw*9/16;box(tv,'#2e4338',0,0,0,tw+.12,th+.12,.14);
  const display=document.createElement('canvas');display.width=640;display.height=360;const pen=display.getContext('2d')!;
  const tvTexture=new T.CanvasTexture(display);tvTexture.colorSpace=T.SRGBColorSpace;textures.add(tvTexture);
  const television=mesh(tv,new T.PlaneGeometry(tw,th),'#ffffff',0,0,.08);television.name='television-screen';television.material=new T.MeshStandardMaterial({map:tvTexture,roughness:.65});
  let caption:string|undefined='initial';function screenCaption(title?:string){if(caption===title)return;caption=title;pen.fillStyle='#294e43';pen.fillRect(0,0,640,360);pen.strokeStyle='#c9b57c';pen.lineWidth=3;pen.strokeRect(22,22,596,316);pen.textAlign='center';pen.fillStyle='#efdfb6';pen.font='18px sans-serif';pen.fillText('DISQUE AMIZADE APRESENTA',320,78);pen.font='31px Georgia';pen.fillText(title?title.slice(0,42):'Aperte o play. Puxe assunto.',320,178,565);pen.font='16px sans-serif';pen.fillText('TOQUE PARA ESCOLHER UM VÍDEO',320,282);tvTexture.needsUpdate=true;}screenCaption();
  const garage=areaById('garage'),disco=new T.Group();root.add(disco);disco.position.set(garage.x-offset.x,2.7,garage.z-offset.z);disco.visible=roomId==='garage';const discoBall=mesh(disco,new T.SphereGeometry(.22,16,10),'#c4c5ad',0,0,0);(discoBall.material as T.MeshStandardMaterial).metalness=.7;
  const bulbs:T.Mesh[]=[];if(roomId==='garage')for(let i=0;i<9;i++){const x=garage.x-garage.w*.39+i*garage.w*.78/8;const b=ball(root,['#e19660','#80b9a5','#cf988b'][i%3],x-offset.x,2.5-Math.sin(i*Math.PI/8)*.22,garage.z-garage.d*.40-offset.z,.04,.055,.04);b.material=(b.material as T.MeshStandardMaterial).clone();bulbs.push(b);}

  let water:T.Mesh|undefined;let waterMaterial:T.ShaderMaterial|undefined;
  if(roomId==='living'){
    const p=local(POOL.x,POOL.z);box(root,'#668e83',p.x,-.06,p.z,POOL.w+.10,.12,POOL.d+.10);
    waterMaterial=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv; uniform float time; void main(){float a=sin(vUv.x*70.+sin(vUv.y*18.+time)*1.4+time*.7);float b=sin(vUv.y*48.-time*.8+sin(vUv.x*22.));float light=pow(max(0.,a*b),8.);vec3 water=mix(vec3(.12,.43,.44),vec3(.32,.68,.65),vUv.y);gl_FragColor=vec4(water+light*.11,1.);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n}',side:T.DoubleSide});
    water=new T.Mesh(new T.PlaneGeometry(POOL.w,POOL.d),waterMaterial);water.rotation.x=-Math.PI/2;water.position.set(p.x,.034,p.z);water.name='pool-water';root.add(water);
    for(const sign of [-1,1]){box(root,'#f2e7cf',p.x+sign*(POOL.w/2+.065),.07,p.z,.13,.12,POOL.d+.26);box(root,'#f2e7cf',p.x,.07,p.z+sign*(POOL.d/2+.065),POOL.w+.26,.12,.13);}
    const glassMaterial=new T.MeshStandardMaterial({color:'#d2e5db',transparent:true,opacity:.12,roughness:.12,depthWrite:false});
    const fence=(x1:number,y1:number,x2:number,y2:number)=>{const a=planPoint(x1,y1),b=planPoint(x2,y2),horizontal=y1===y2,length=Math.hypot(b.x-a.x,b.z-a.z);for(let i=0;i<=Math.ceil(length/1.25);i++){const t=i/Math.ceil(length/1.25);worldBox('#8c9a8d',a.x+(b.x-a.x)*t,.47,a.z+(b.z-a.z)*t,.028,.94,.028);}const pane=worldBox('#d2e5db',(a.x+b.x)/2,.48,(a.z+b.z)/2,horizontal?length:.016,.88,horizontal?.016:length);pane.material=glassMaterial;pane.castShadow=false;};
    fence(238,260,382,260);fence(681,160,681,261);
    const alfresco=areaById('alfresco');
    for(const x of [alfresco.x-alfresco.w/2+.08,alfresco.x+alfresco.w/2-.08])for(const z of [alfresco.z-alfresco.d/2+.08,alfresco.z+alfresco.d/2-.08])worldBox('#e7dcc6',x,1.30,z,.085,2.60,.085);
    for(const x of [alfresco.x-alfresco.w/2+.08,alfresco.x+alfresco.w/2-.08])worldBox('#b99e79',x,2.60,alfresco.z,.10,.10,alfresco.d);
    for(let z=alfresco.z-alfresco.d/2+.1;z<alfresco.z+alfresco.d/2;z+=.72)worldBox('#cab491',alfresco.x,2.66,z,alfresco.w,.055,.045);
    const porch=areaById('porch');for(const z of [porch.z-porch.d/2+.09,porch.z+porch.d/2-.09])worldBox('#eee4cf',porch.x+porch.w/2-.10,1.3,z,.10,2.6,.10);worldBox('#c4b18d',porch.x+porch.w/2-.10,2.61,porch.z,.12,.10,porch.d);
    const garden=planRect(210,145,1110,798);const lawn=worldBox('#a8b98b',garden.x,-.37,garden.z,garden.w,.12,garden.d);lawn.name='landscape-base';
  }

  // Bake opaque colors into vertex attributes, preserving each hit target and receiver group.
  // All batched surfaces share the same lighting properties; glass and animated meshes stay separate.
  root.updateMatrixWorld(true);
  const batchTargets=[root,interior,...root.children.filter(o=>['seat','phone','table','poker'].includes(o.userData.kind)),...telephoneGroups];
  const batchMaterial=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.83});
  for(const group of batchTargets){const meshes:T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>[]=[];group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert();
    group.traverse(o=>{if(!(o instanceof T.Mesh)||!(o.material instanceof T.MeshStandardMaterial)||o===water||o===television||o===discoBall||bulbs.includes(o)||o===floor||o.material.transparent||o.material.map)return;let parent:T.Object3D|null=o.parent;while(parent&&parent!==group){if(parent.userData.kind||parent===interior||parent===disco)return;parent=parent.parent;}if(parent===group)meshes.push(o as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>);});
    if(meshes.length<2)continue;
    const parts=meshes.map(m=>{const source=m.geometry.clone();const g=source.index?source.toNonIndexed():source;if(g!==source)source.dispose();g.applyMatrix4(inverse.clone().multiply(m.matrixWorld));const colors=new Float32Array(g.getAttribute('position').count*3),c=m.material.color;for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(colors,3));return g;});
    const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(!geometry)continue;meshes.forEach(m=>m.removeFromParent());const merged=mesh(group,geometry,'#ffffff',0,0,0);merged.material=batchMaterial;
  }
  return{root,floor:floor!,television,screenCaption,cutaway:(on:boolean)=>{tv.visible=!on;},phones:telephoneGroups,disco,interior,
    update:(time:number,reduced:boolean)=>{if(waterMaterial)waterMaterial.uniforms.time.value=reduced?0:time*.00045;},
    screen:(on:boolean)=>{const m=television.material as T.MeshStandardMaterial;m.emissive.set(on?'#446c51':'#000000');m.emissiveIntensity=on?.4:0;},
    lights:(on:boolean)=>bulbs.forEach(b=>{const m=b.material as T.MeshStandardMaterial;m.emissive.copy(m.color);m.emissiveIntensity=on?1.2:0;}),
    dispose(){const mats=new Set<T.Material>(materials.values());root.traverse(o=>{if(o instanceof T.Mesh){ownedGeometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});ownedGeometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene.remove(root);},
  };
}
