type Point={x:number;y:number};
export type GestureDelta={from:Point;to:Point;ratio:number;count:number};
/** Pointer ownership lasts until the final finger lifts, so a pinch cannot end as a tap. */
export function createCameraGestures(){
 const points=new Map<number,Point>();let start:Point|null=null,dragged=false,multi=false;
 const center=()=>{const p=[...points.values()].slice(0,2);return{x:p.reduce((n,p)=>n+p.x,0)/p.length,y:p.reduce((n,p)=>n+p.y,0)/p.length};};
 const span=()=>{const p=[...points.values()];return p.length<2?0:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);};
 return{
  get count(){return points.size;},
  down(id:number,p:Point){if(!points.size){start=p;dragged=false;multi=false;}points.set(id,p);if(points.size>1)multi=true;},
  move(id:number,p:Point):GestureDelta|null{
   if(!points.has(id))return null;const from=center(),distance=span();points.set(id,p);const to=center();
   if(!multi&&!dragged&&start&&Math.hypot(p.x-start.x,p.y-start.y)<8)return null;
   dragged=true;return{from,to,ratio:points.size===2&&distance>1?span()/distance:1,count:points.size};
  },
  up(id:number,p:Point){if(!points.has(id))return false;const tap=!multi&&!dragged&&points.size===1&&!!start&&Math.hypot(p.x-start.x,p.y-start.y)<8;points.delete(id);if(!points.size)start=null;return tap;},
  cancel(){points.clear();start=null;dragged=false;multi=false;},
 };
}
