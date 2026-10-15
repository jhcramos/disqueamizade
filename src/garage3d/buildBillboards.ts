import * as T from 'three';
import {BILLBOARDS,BILLBOARD_DAILY_PRICE} from './billboards';
/** Shared geometry, materials and canvas: four static signs, no extra animation loop. */
export function buildBillboards(parent:T.Group){
 const root=new T.Group();root.name='roadside-billboards';parent.add(root);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d')!;
 c.fillStyle='#fbf2df';c.fillRect(0,0,1024,512);c.fillStyle='#294f40';c.fillRect(0,0,1024,92);
 c.textAlign='center';c.fillStyle='#fff4db';c.font='600 30px sans-serif';c.fillText('DISQUE AMIZADE · NA ROTA DOS ENCONTROS',512,58);
 c.fillStyle='#43323c';c.font='68px Georgia';c.fillText('Sua marca mora aqui.',512,190);
 c.fillStyle='#b64c2c';c.font='bold 100px sans-serif';c.fillText(`R$ ${BILLBOARD_DAILY_PRICE} / dia`,512,310);
 c.fillStyle='#294f40';c.font='bold 35px sans-serif';c.fillText('ESPAÇO DISPONÍVEL PARA ANUNCIAR',512,395);
 c.fillStyle='#756759';c.font='27px sans-serif';c.fillText('Toque para consultar disponibilidade',512,462);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const ink=new T.MeshBasicMaterial({map:texture}),frame=new T.MeshStandardMaterial({color:'#294f40',roughness:.85}),post=new T.MeshStandardMaterial({color:'#655d4d',roughness:.9});
 const faceGeo=new T.PlaneGeometry(5.6,2.8),frameGeo=new T.BoxGeometry(5.82,3.02,.20),postGeo=new T.BoxGeometry(.18,4.2,.18),footGeo=new T.BoxGeometry(.7,.16,.7);
 for(const b of BILLBOARDS){const g=new T.Group();g.name=b.id;g.userData.billboard=b.id;g.position.set(b.x,0,b.z);g.rotation.y=b.yaw;root.add(g);
  const backing=new T.Mesh(frameGeo,frame);backing.position.y=4.2;backing.castShadow=true;g.add(backing);
  for(const side of [-1,1]){const face=new T.Mesh(faceGeo,ink);face.position.set(0,4.2,.106*side);face.rotation.y=side<0?Math.PI:0;g.add(face);}
  for(const x of [-2.1,2.1]){const p=new T.Mesh(postGeo,post);p.position.set(x,2.1,0);p.castShadow=true;g.add(p);const foot=new T.Mesh(footGeo,post);foot.position.set(x,.08,0);g.add(foot);}
 }
 return{dispose(){parent.remove(root);[faceGeo,frameGeo,postGeo,footGeo].forEach(g=>g.dispose());[ink,frame,post].forEach(m=>m.dispose());texture.dispose();}};
}
