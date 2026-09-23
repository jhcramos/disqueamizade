import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {LAND_PRICE,NEIGHBORHOOD_LOTS,NEIGHBORHOOD_TREES,NEIGHBORHOOD_BENCHES} from './neighborhood';

/** Low-cost scenery: one mesh per static material, six interactive sale signs. */
export function buildNeighborhood(scene:T.Scene){
 const root=new T.Group();root.name='disque-neighborhood';root.userData.neighborhood=true;scene.add(root);
 const cube=new T.BoxGeometry(1,1,1),sphere=new T.IcosahedronGeometry(1,1),parts=new Map<string,T.BufferGeometry[]>(),materials:T.Material[]=[],geometries:T.BufferGeometry[]=[],textures:T.Texture[]=[];
 function solid(color:string,x:number,y:number,z:number,w:number,h:number,d:number,round=false){const g=(round?sphere:cube).clone();g.scale(w,h,d);g.translate(x,y,z);const batch=parts.get(color)??[];batch.push(g);parts.set(color,batch);}
 solid('#80947a',0,-.24,0,107,.4,95);
 solid('#5d6863',0,-.012,-43,104,.026,6);solid('#5d6863',0,-.012,43,104,.026,6);
 solid('#5d6863',-49,-.012,0,6,.026,86);solid('#5d6863',49,-.012,0,6,.026,86);
 for(const x of [-44.8,44.8]){solid('#d5cdbb',x,-.004,0,2.4,.034,80);solid('#f0e9d9',x+Math.sign(x)*1.16,.035,0,.12,.10,80);}
 for(const z of [-39.6,39.6]){solid('#d5cdbb',0,-.004,z,92,.034,2.4);solid('#f0e9d9',0,.035,z+Math.sign(z)*1.16,92,.10,.12);}
 for(const z of [-13.7,13.7])solid('#dbd4c3',0,-.004,z,90,.034,3.7);
 for(const x of [-15,15])solid('#dbd4c3',x,-.004,0,2,.034,77);
 // Lanes and zebra crossings connect the outside loop to pedestrian paths.
 for(let x=-45;x<=45;x+=5)for(const z of [-43,43])solid('#dcd9ba',x,.009,z,2,.008,.12);
 for(let z=-39;z<=39;z+=5)for(const x of [-49,49])solid('#dcd9ba',x,.009,z,.12,.008,2);
 for(const z of [-13.7,13.7])for(const x of [-49,49])for(let i=-2;i<=2;i++)solid('#ece5d4',x,.012,z+i*.64,5,.01,.36);
 for(const z of [-43,43])for(let i=-3;i<=3;i++)solid('#ece5d4',i*.65,.012,z,.38,.01,5);
 for(const lot of NEIGHBORHOOD_LOTS){
  solid('#a3b38c',lot.x,-.021,lot.z,lot.w,.02,lot.d);
  for(const s of [-1,1]){
   solid('#d7dbba',lot.x+s*(lot.w/2-.10),-.005,lot.z,.13,.025,lot.d);
   solid('#d7dbba',lot.x,-.005,lot.z+s*(lot.d/2-.1),lot.w,.025,.13);
   for(const t of [-1,1])solid('#eee7d6',lot.x+s*(lot.w/2-.15),.16,lot.z+t*(lot.d/2-.15),.25,.34,.25);
  }
  const front=lot.z<0?1:-1;
  solid('#dcd4be',lot.sign.x,-.004,lot.sign.z+front*1.3,2,.04,2.6);
  const sign=new T.Group();sign.position.set(lot.sign.x,0,lot.sign.z);sign.rotation.y=front===1?0:Math.PI;sign.userData.lotId=lot.id;root.add(sign);
  for(const x of [-.65,.65]){const g=new T.BoxGeometry(.09,1.7,.09),m=new T.MeshStandardMaterial({color:'#725b46',roughness:.9}),post=new T.Mesh(g,m);post.position.set(x,.85,0);sign.add(post);materials.push(m);geometries.push(g);}
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=448;const c=canvas.getContext('2d')!;
  c.fillStyle='#faf4e8';c.fillRect(0,0,768,448);c.fillStyle='#ac492e';c.fillRect(0,0,768,88);
  c.textAlign='center';c.fillStyle='#fff6e8';c.font='600 35px sans-serif';c.fillText('TERRENO VIRTUAL À VENDA',384,58);
  c.fillStyle='#39263b';c.font='48px Georgia';c.fillText(`Lote ${lot.id} · ${lot.name}`,384,167);c.font='bold 94px Georgia';c.fillText(`R$ ${LAND_PRICE}`,384,288);
  c.fillStyle='#526848';c.font='28px sans-serif';c.fillText('Seu lugar no Disque Amizade',384,355);c.fillText('Toque para conhecer',384,400);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.push(texture);
  const mat=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}),g=new T.PlaneGeometry(2.4,1.4),board=new T.Mesh(g,mat);board.position.y=1.75;sign.add(board);materials.push(mat);geometries.push(g);
 }
 for(const p of NEIGHBORHOOD_TREES){solid('#806447',p.x,.75,p.z,.25,1.5,.25);solid('#557758',p.x,2.3,p.z,1.0,1.1,1.0,true);solid('#6e8b61',p.x+.3,2.85,p.z,1.05,.85,.95,true);}
 for(const b of NEIGHBORHOOD_BENCHES){solid('#a98057',b.x,.48,b.z,b.w,.12,b.d);solid('#a98057',b.x,.88,b.z-.28,b.w,.6,.10);for(const x of [-.9,.9])solid('#536259',b.x+x,.25,b.z,.10,.5,.5);}
 // Neighbourhood commons beside the existing house, without occupying a sale parcel.
 for(const x of [-30,30]){solid('#d9cfb8',x,-.008,0,3,.028,24);solid('#d9cfb8',x,-.007,0,26,.027,2.5);}
 for(const [color,list]of parts){const geometry=mergeGeometries(list,false)!;list.forEach(g=>g.dispose());geometries.push(geometry);const material=new T.MeshStandardMaterial({color,roughness:.95});materials.push(material);const mesh=new T.Mesh(geometry,material);mesh.receiveShadow=true;root.add(mesh);}
 cube.dispose();sphere.dispose();
 return{root,dispose(){scene.remove(root);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
