import {useEffect,useRef,useState} from 'react';
import {TABLE,handNames,rankHand,type PokerAction,type PokerView} from './model';
import type {Visitor} from '../residents/model';
import './poker.css';
import {usePokerCall,type CallReply} from './usePokerCall';
import {PokerVideo,PokerAudio} from './PokerVideo';
import {readCameraMaskChoice as readMask} from '../../garage/cameraPreference';
import {CameraPreview} from '../../garage/CameraPreview';
import type {Appearance} from '../../garage/avatarStyle';
const suit=['♣','♦','♥','♠'],rank=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
function Card({card}:{card?:number}){return <span className={`poker-card ${card===undefined?'is-back':Math.floor(card/13)%3?'is-red':''}`} aria-label={card===undefined?'Carta oculta':`${rank[card%13]} ${suit[Math.floor(card/13)]}`}>{card===undefined?'✦':<>{rank[card%13]}<small>{suit[Math.floor(card/13)]}</small></>}</span>;}
export function PokerPanel({open,onClose,getVisitor,onSeat,avatar,appearance,unavailable=false,onCallActive}:{avatar:number;appearance:Appearance;unavailable?:boolean;onCallActive?:(active:boolean)=>void;open:boolean;onClose:()=>void;getVisitor:()=>Visitor;onSeat:(seat:number|null)=>void}){
 const [game,setGame]=useState<PokerView|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[online,setOnline]=useState(false),[clock,setClock]=useState(Date.now());
 const props=useRef({open,getVisitor,onSeat});props.current={open,getVisitor,onSeat};
 const [preview,setPreview]=useState(false);
 const tokenRef=useRef(''),callQueue=useRef<Promise<unknown>>(Promise.resolve());
 const call=usePokerCall({avatar,appearance,onActive:onCallActive,request:action=>{
  const request=callQueue.current.catch(()=>{}).then(async()=>{
  const response=await fetch('/api/house-residents',{method:'POST',headers:{'Content-Type':'application/json',...(tokenRef.current?{'X-Resident-Session':tokenRef.current}:{})},body:JSON.stringify({feature:'poker',visitor:props.current.getVisitor(),call:{action,id:crypto.randomUUID()}}),signal:AbortSignal.timeout(10000)});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível conectar à conversa.');return data as CallReply;
  });callQueue.current=request;return request;
 }});
 const callRef=useRef(call);callRef.current=call;
 useEffect(()=>{if(unavailable&&callRef.current.active.current)void callRef.current.leave();},[unavailable]);
 const command=useRef<(action:PokerAction)=>void>();
 useEffect(()=>{
  let closed=false,fetching=false,joined=false,token='',pending:{id:string;action:PokerAction}|undefined;
  try{token=sessionStorage.getItem('house-poker-session')||'';}catch{/* private mode */}tokenRef.current=token;
  async function poll(){if(closed||fetching||(!props.current.open&&!joined&&!pending))return;fetching=true;
   const sent=pending,startedAt=Date.now();
   try{
    const response=await fetch('/api/house-residents',{method:'POST',headers:{'Content-Type':'application/json',...(token?{'X-Resident-Session':token}:{})},body:JSON.stringify({feature:'poker',visitor:props.current.getVisitor(),command:sent,callActive:callRef.current.active.current}),signal:AbortSignal.timeout(10000)});
    if(closed)return;
    if(response.status===401){token='';tokenRef.current='';void callRef.current.leave(false);pending=undefined;setBusy(false);try{sessionStorage.removeItem('house-poker-session');}catch{}return;}
    const data=await response.json();
    if(!response.ok){setOnline(false);setMessage(typeof data.error==='string'?data.error:'Não foi possível abrir a mesa. Tente novamente.');if(response.status===400){pending=undefined;setBusy(false);}return;}
    if(!data.game||!Array.isArray(data.game.players))throw new Error('invalid game');
    if(data.identity?.token){token=data.identity.token;tokenRef.current=token;try{sessionStorage.setItem('house-poker-session',token);}catch{}}
    const me=data.game.players.find((p:{id:string;seat:number;left:boolean})=>p.id===data.game.me&&!p.left);
    if(me&&!joined)props.current.onSeat(me.seat);
    if(!me&&joined)props.current.onSeat(null);
    joined=!!me;callRef.current.sync(data,startedAt);setGame(data.game);setOnline(true);
    if(sent&&data.commandId===sent.id){pending=undefined;setBusy(false);setMessage(data.result||'');}
   }catch{if(!closed){setOnline(false);setMessage('A mesa está reconectando. Suas cartas continuam protegidas.');}}
   finally{fetching=false;}
  }
  command.current=action=>{if(pending)return;pending={id:crypto.randomUUID(),action};setBusy(true);void poll();};
  const timer=setInterval(()=>{setClock(Date.now());void poll();},1200);void poll();
  return()=>{closed=true;command.current=undefined;clearInterval(timer);};
 },[]);
 const mediaUI=<><PokerAudio tiles={call.tiles}/>{preview&&<CameraPreview avatar={avatar} appearance={appearance} onClose={()=>{setPreview(false);call.changeMask(readMask());}}/>}</>;
 if(!open)return mediaUI;
 const me=game?.players.find(p=>p.id===game.me&&!p.left),near=Math.hypot(getVisitor().position.x-TABLE.x,getVisitor().position.z-TABLE.z)<2.1;
 const action=(a:PokerAction)=>{if(a==='leave')void call.leave();command.current?.(a);};
 const phase={waiting:'A mesa está aberta',preflop:'Pré-flop',flop:'Flop',turn:'Turn',river:'River',showdown:'Fim da mão'};
 return <>{mediaUI}<section className="house-poker" aria-label="Mesa de pôquer" onPointerDown={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();onClose();}}}>
  <header><div><small>SALA DE JOGOS · MESA DE PÔQUER</small><h2>Uma mão entre amigos.</h2></div><button onClick={onClose} aria-label="Minimizar pôquer">×</button></header>
  <div className="poker-scroll"><p className="poker-intro">Texas Hold’em · até 4 pessoas · fichas gratuitas, sem dinheiro real</p>
  <div className="poker-table-body"><PokerVideo call={call} seated={!!me&&!me.left} unavailable={unavailable} onPreview={()=>setPreview(true)}/>
  <div className="poker-felt">
   <div className="poker-players">{[0,1,2,3].map(seat=>{const p=game?.players.find(p=>p.seat===seat);return <div key={seat} className={`poker-player ${!p?'is-empty':''} ${p?.id===me?.id?'is-self':''} ${p?.id===game?.turn?'is-turn':''} ${p?.folded?'is-folded':''}`}><strong>{p?p.id===me?.id?`${p.name} · você`:p.name:'Lugar livre'}{p&&game?.dealer===seat&&<i title="Dealer">D</i>}</strong><span>{p?`${p.chips.toLocaleString('pt-BR')} fichas${p.left?' · saiu':p.waiting?' · próxima mão':p.folded?' · desistiu':''}`:'Convide alguém da casa'}</span>{p&&<div className="poker-mini-cards"><Card card={p.cards[0]}/><Card card={p.cards[1]}/>{p.bet>0&&<small>+{p.bet}</small>}</div>}</div>;})}</div>
   <div className="poker-board" aria-label="Cartas comunitárias">{Array.from({length:5},(_,i)=><Card key={i} card={game?.board[i]}/>)}</div>
   <div className="poker-pot"><span>{phase[game?.street??'waiting']}</span><strong>Pote · {game?.pot??0}</strong></div>
  </div>
  </div><p className="poker-note" role="status">{game?.note||'Conectando à mesa…'}</p>
  {me&&me.cards.length===2&&game&&game.board.length>=3&&!me.folded&&<p className="poker-hand">Sua combinação: {handNames[rankHand([...me.cards,...game.board])[0]]}</p>}
  {game?.turn&&<p className="poker-turn">{game.turn===me?.id?'Sua vez':`Vez de ${game.players.find(p=>p.id===game.turn)?.name}`} · {Math.max(0,Math.min(30,Math.ceil((game.deadline-clock)/1000)))}s</p>}
  {message&&<p className="poker-feedback" role="status">{message}</p>}
  <details><summary>Como funciona</summary><p>Cada pessoa recebe duas cartas privadas. Combine com as cinco cartas da mesa para formar a melhor mão de cinco cartas. Blinds 10/20; aumentos de 20 no pré-flop e flop, e 40 no turn e river, até três aumentos por rodada.</p><p>Você tem 30 segundos por jogada. Ao esgotar o tempo, passa se não houver aposta para pagar, ou desiste. Sair da sala de jogos ou perder a conexão por 45 segundos libera seu lugar. Quem chega durante a mão aguarda a próxima. Fichas zeradas são repostas gratuitamente na próxima distribuição.</p></details>
 </div>
  <div className="poker-actions">
   {!me?<button disabled={!online||busy||!near||(game?.players.length??0)>=4} onClick={()=>action('join')}>{!near?'Aproxime-se da mesa':(game?.players.length??0)>=4?'Mesa completa':'Sentar e receber 1.000 fichas'}</button>:<>
    {game?.canDeal&&<button disabled={busy||!online} onClick={()=>action('deal')}>Distribuir cartas</button>}
    {game?.canAct&&<><button className="secondary" disabled={busy||!online} onClick={()=>action('fold')}>Desistir</button><button disabled={busy||!online} onClick={()=>action('call')}>{game.call?`Pagar ${game.call}${game.call===me.chips?' · all-in':''}`:'Passar'}</button><button disabled={busy||!online||!game.canRaise} onClick={()=>action('raise')}>Aumentar +{game.raise}</button></>}
    {!game?.canAct&&!game?.canDeal&&<span>{game?.players.filter(p=>!p.left).length===1?'Esperando companhia…':'Acompanhe a mesa. Sua vez já chega.'}</span>}
    <button className="secondary poker-leave" disabled={busy} onClick={()=>action('leave')}>Sair da mesa</button>
   </>}
  </div>
 </section></>;
}
