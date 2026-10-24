import {useEffect,useRef,useState} from 'react';
/** Local synthesized engine: no audio downloads, microphones or network traffic. */
function engine(){
 const context=new AudioContext(),gain=context.createGain(),filter=context.createBiquadFilter();
 filter.type='lowpass';filter.frequency.value=360;gain.gain.value=0;filter.connect(gain);gain.connect(context.destination);
 const tones=[context.createOscillator(),context.createOscillator()];tones.forEach((o,i)=>{o.type=i?'triangle':'sawtooth';o.frequency.value=45+i*2;o.connect(filter);o.start();});
 return{resume(){void context.resume().catch(()=>{});},update(speed:number,gas:boolean,audible:boolean){const t=context.currentTime;tones.forEach((o,i)=>o.frequency.setTargetAtTime(42+Math.abs(speed)*10+(gas?28:0)+i*2,t,.12));gain.gain.setTargetAtTime(audible?(gas?.018:Math.abs(speed)>.2?.009:0):0,t,.08);},dispose(){tones.forEach(o=>o.stop());void context.close().catch(()=>{});}};
}
export function VehiclePedals({speed,disabled,onChange}:{speed:number;disabled:boolean;onChange:(pedal:'gas'|'brake',pressed:boolean)=>void}){
 const callback=useRef(onChange);callback.current=onChange;
 const sound=useRef<ReturnType<typeof engine>>();const pointers=useRef(new Map<number,'gas'|'brake'>());
 const [gas,setGas]=useState(false),[brake,setBrake]=useState(false),[muted,setMuted]=useState(false),[awake,setAwake]=useState(true);
 const publish=(pedal:'gas'|'brake',pressed:boolean)=>{(pedal==='gas'?setGas:setBrake)(pressed);callback.current(pedal,pressed);};
 const reset=()=>{pointers.current.clear();publish('gas',false);publish('brake',false);sound.current?.update(0,false,false);};
 useEffect(()=>{const blur=()=>{reset();setAwake(false);};const focus=()=>setAwake(true);const visibility=()=>document.hidden?blur():focus();const input=(e:FocusEvent)=>{if(e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable=true]'))reset();};window.addEventListener('blur',blur);window.addEventListener('focus',focus);document.addEventListener('visibilitychange',visibility);document.addEventListener('focusin',input);return()=>{window.removeEventListener('blur',blur);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('focusin',input);reset();sound.current?.dispose();sound.current=undefined;};},[]);
 useEffect(()=>{if(disabled)reset();},[disabled]);
 useEffect(()=>{sound.current?.update(speed,gas&&!brake,!disabled&&!muted&&awake&&!document.hidden);},[speed,gas,brake,disabled,muted,awake]);
 const unlock=()=>{setAwake(true);try{sound.current??=engine();sound.current.resume();}catch{/* Driving remains available without Web Audio. */}};
 const end=(id:number)=>{const pedal=pointers.current.get(id);if(!pedal)return;pointers.current.delete(id);if(![...pointers.current.values()].includes(pedal))publish(pedal,false);};
 return <div className="vehicle-pedals" aria-label="Pedais do buggy">
 <button className="vehicle-engine-toggle" aria-pressed={muted} onClick={()=>{unlock();setMuted(v=>!v);}}>{muted?'Ativar som do motor':'Silenciar motor'}</button>
 <div>{(['brake','gas'] as const).map(pedal=><button key={pedal} className={`vehicle-pedal vehicle-pedal-${pedal}`} disabled={disabled} aria-label={pedal==='gas'?'Acelerar':'Frear'} aria-pressed={pedal==='gas'?gas:brake}
 onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();unlock();pointers.current.set(e.pointerId,pedal);e.currentTarget.setPointerCapture(e.pointerId);publish(pedal,true);}}
 onPointerUp={e=>{e.stopPropagation();end(e.pointerId);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
 onPointerCancel={e=>end(e.pointerId)} onLostPointerCapture={e=>end(e.pointerId)}
 onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();e.stopPropagation();if(e.repeat)return;unlock();publish(pedal,true);}}}
 onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();publish(pedal,false);}}} onBlur={()=>{for(const [id,p]of pointers.current)if(p===pedal)pointers.current.delete(id);publish(pedal,false);}}>{pedal==='gas'?'Acelerar':'Frear'}</button>)}</div>
 </div>;
}
