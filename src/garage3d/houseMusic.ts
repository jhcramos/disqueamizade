/** Quiet, locally synthesized original phrase. Starts only after a user gesture. */
export function createHouseMusic(){
  let context:AudioContext|null=null,timer:ReturnType<typeof setInterval>|undefined,step=0,next=0;
  const notes=[60,64,67,71,69,67,64,62,57,60,64,67,65,64,60,59];
  function schedule(){if(!context)return;while(next<context.currentTime+.35){
    const oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.type='sine';oscillator.frequency.value=440*2**((notes[step%notes.length]-69)/12);
    gain.gain.setValueAtTime(0,next);gain.gain.linearRampToValueAtTime(.035,next+.025);gain.gain.exponentialRampToValueAtTime(.0001,next+.38);
    oscillator.connect(gain);gain.connect(context.destination);oscillator.start(next);oscillator.stop(next+.4);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};next+=.3;step++;
  }}
  function stop(){if(timer)clearInterval(timer);timer=undefined;const previous=context;context=null;if(previous)void previous.close().catch(()=>{});}
  return{async start(){stop();context=new AudioContext();await context.resume();if(!context)return;next=context.currentTime;step=0;schedule();timer=setInterval(schedule,200);},stop};
}
