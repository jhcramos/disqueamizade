import {useEffect,useRef,useState} from 'react';
import {createJoystick,type StickVector} from './joystick';

export function WalkJoystick({onMove,disabled=false,label='Andar'}:{label?:string;onMove:(v:StickVector)=>void;disabled?:boolean}){
 const stick=useRef(createJoystick()),callback=useRef(onMove);
 callback.current=onMove;
 const [value,setValue]=useState<StickVector>({x:0,y:0});
 useEffect(()=>{
  const stop=()=>{stick.current.cancel();setValue({x:0,y:0});callback.current({x:0,y:0});};
  const focus=(e:FocusEvent)=>{if(e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable=true]'))stop();};
  stop();window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);document.addEventListener('focusin',focus);
  return()=>{stop();window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);document.removeEventListener('focusin',focus);};
 },[disabled]);
 function publish(v:StickVector){setValue({...v});callback.current(v);}
 return <button type="button" className="house-walk-joystick" aria-label={`Joystick para ${label.toLowerCase()}: arraste na direção desejada`} disabled={disabled}
  onPointerDown={e=>{e.preventDefault();e.stopPropagation();if(!stick.current.start(e.pointerId,e.clientX,e.clientY))return;e.currentTarget.setPointerCapture(e.pointerId);}}
  onPointerMove={e=>{e.stopPropagation();publish(stick.current.move(e.pointerId,e.clientX,e.clientY));}}
  onPointerUp={e=>{e.stopPropagation();publish(stick.current.end(e.pointerId));if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
  onPointerCancel={e=>publish(stick.current.end(e.pointerId))}
  onLostPointerCapture={e=>publish(stick.current.end(e.pointerId))}
  onKeyDown={e=>{const v:Record<string,StickVector>={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}};if(v[e.key]){e.preventDefault();e.stopPropagation();publish(v[e.key]);}}}
  onKeyUp={e=>{e.stopPropagation();publish({x:0,y:0});}}
  onBlur={()=>{stick.current.cancel();publish({x:0,y:0});}}>
  <span className="house-joystick-knob" style={{transform:`translate(${value.x*38}px,${value.y*38}px)`}}/><span className="house-joystick-label">{label}</span>
 </button>;
}
