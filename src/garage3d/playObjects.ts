import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BALL_START, CUSHION_START, playPosition } from '../garage/play';
import type { LiveHouseSession } from './liveHouse';
import { toWorld } from './coordinates';
import { roomIds } from './layout';
export function createPlayObjects(scene:T.Scene){
  const ballGeometry=new T.IcosahedronGeometry(.18,0),cushionGeometry=new RoundedBoxGeometry(.55,.21,.38,2,.08);
  const ballMaterial=new T.MeshStandardMaterial({color:'#e6dab8',roughness:.85}),cushionMaterial=new T.MeshStandardMaterial({color:'#ce793e',roughness:1});
  const objects=roomIds.filter(id=>id!=='bar').map(room=>{
    const ball=new T.Mesh(ballGeometry,ballMaterial),cushion=new T.Mesh(cushionGeometry,cushionMaterial);ball.castShadow=true;cushion.castShadow=true;scene.add(ball,cushion);
    const p=toWorld(BALL_START,room),q=toWorld(CUSHION_START,room);ball.position.set(p.x,.18,p.z);cushion.position.set(q.x,.13,q.z);return{room,ball,cushion};
  });
  return{sync(s:LiveHouseSession,now:number){const entry=objects.find(o=>o.room===s.self.room);if(!entry)return;
    const ball=toWorld(playPosition(s.play.ball,BALL_START),entry.room);entry.ball.position.set(ball.x,.18,ball.z);if(s.play.ball&&Date.now()-s.play.ball.at<1100)entry.ball.rotation.x=now*.01;
    const holder=s.play.cushion?.on?[s.self,...s.people].find(p=>p.id===s.play.cushion?.actor):undefined;
    const cushion=toWorld(holder?.position??playPosition(s.play.cushion,CUSHION_START),entry.room);entry.cushion.position.set(cushion.x,holder?.75:.13,cushion.z+.22);
  },dispose(){objects.forEach(o=>{scene.remove(o.ball,o.cushion);});ballGeometry.dispose();cushionGeometry.dispose();ballMaterial.dispose();cushionMaterial.dispose();}};
}
