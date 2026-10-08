export type StickVector = {x:number;y:number};
export function createJoystick(radius=44){
 let pointer:number|null=null,origin={x:0,y:0},value:StickVector={x:0,y:0};
 return {
  start(id:number,x:number,y:number){if(pointer!==null)return false;pointer=id;origin={x,y};return true;},
  move(id:number,x:number,y:number){
   if(id!==pointer)return value;
   const dx=x-origin.x,dy=y-origin.y,d=Math.hypot(dx,dy),dead=radius*.12;
   const strength=Math.min(1,Math.max(0,(d-dead)/(radius-dead)));
   value=d>dead?{x:dx/d*strength,y:dy/d*strength}:{x:0,y:0};return value;
  },
  end(id:number){if(id===pointer){pointer=null;value={x:0,y:0};}return value;},
  cancel(){pointer=null;value={x:0,y:0};},
  value(){return value;}
 };
}
export function walkVector(yaw:number,stick:StickVector){
 const forward=-stick.y,side=stick.x,norm=Math.max(1,Math.hypot(forward,side));
 return {x:(Math.sin(yaw)*forward-Math.cos(yaw)*side)/norm,z:(Math.cos(yaw)*forward+Math.sin(yaw)*side)/norm};
}
