export type Card=number; // 0..51: rank 2..A, clubs/diamonds/hearts/spades
export type Player={id:string;name:string;seat:number;chips:number;cards:Card[];bet:number;total:number;folded:boolean;inHand:boolean;acted:boolean;seen:number;left?:boolean};
export type PokerState={players:Player[];deck:Card[];board:Card[];street:'waiting'|'preflop'|'flop'|'turn'|'river'|'showdown';dealer:number;turn:string|null;deadline:number;currentBet:number;raises:number;hand:number;note:string;winners:string[]};
export type PokerAction='join'|'leave'|'deal'|'fold'|'call'|'raise';
export const TABLE={x:5.35,z:.85};
export const createPoker=():PokerState=>({players:[],deck:[],board:[],street:'waiting',dealer:-1,turn:null,deadline:0,currentBet:0,raises:0,hand:0,note:'Duas pessoas já formam uma mesa. Chegue mais!',winners:[]});
export const activeHand=(s:PokerState)=>!['waiting','showdown'].includes(s.street);
export const raiseSize=(s:PokerState)=>s.street==='turn'||s.street==='river'?40:20;
const live=(s:PokerState)=>s.players.filter(p=>p.inHand&&!p.folded);
// Cyclic seat order excluding the origin until the end.
const cycle=(players:Player[],seat:number)=>[...players].sort((a,b)=>((a.seat-seat+4)%4||4)-((b.seat-seat+4)%4||4));
function pay(p:Player,n:number){const amount=Math.min(p.chips,Math.max(0,n));p.chips-=amount;p.bet+=amount;p.total+=amount;}
const compare=(a:number[],b:number[])=>{for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]??0)-(b[i]??0);if(d)return d;}return 0;};
function five(cards:Card[]):number[]{
 const ranks=cards.map(c=>c%13+2).sort((a,b)=>b-a),unique=[...new Set(ranks)];
 const flush=cards.every(c=>Math.floor(c/13)===Math.floor(cards[0]/13));
 const straight=unique.length===5&&(unique[0]-unique[4]===4?unique[0]:unique.join(',')==='14,5,4,3,2'?5:0);
 const groups=[...new Set(ranks)].map(r=>({r,n:ranks.filter(v=>v===r).length})).sort((a,b)=>b.n-a.n||b.r-a.r);
 if(flush&&straight)return[8,straight];
 if(groups[0].n===4)return[7,groups[0].r,groups[1].r];
 if(groups[0].n===3&&groups[1].n===2)return[6,groups[0].r,groups[1].r];
 if(flush)return[5,...ranks];if(straight)return[4,straight];
 if(groups[0].n===3)return[3,...groups.map(g=>g.r)];
 if(groups[0].n===2&&groups[1].n===2)return[2,...groups.map(g=>g.r)];
 if(groups[0].n===2)return[1,...groups.map(g=>g.r)];return[0,...ranks];
}
export function rankHand(cards:Card[]){let best:number[]=[];for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){const rank=five([cards[a],cards[b],cards[c],cards[d],cards[e]]);if(compare(rank,best)>0)best=rank;}return best;}
export const handNames=['Carta alta','Um par','Dois pares','Trinca','Sequência','Flush','Full house','Quadra','Straight flush'];
function settle(s:PokerState){
 const contenders=live(s);s.winners=[];
 // Contributions include folded and departed players. Each level forms a side pot.
 const levels=[...new Set(s.players.map(p=>p.total).filter(Boolean))].sort((a,b)=>a-b);
 let previous=0;
 for(const level of levels){
  const contributors=s.players.filter(p=>p.total>=level),amount=(level-previous)*contributors.length;previous=level;
  let eligible=contenders.filter(p=>p.total>=level);
  // Uncalled chips belong back to their contributor, including a disconnected player.
  if(!eligible.length){for(const p of contributors)p.chips+=level-(levels[levels.indexOf(level)-1]??0);continue;}
  let best:number[]=[];const scores=new Map(eligible.map(p=>[p.id,rankHand([...p.cards,...s.board])]));
  for(const score of scores.values())if(compare(score,best)>0)best=score;
  eligible=cycle(eligible.filter(p=>compare(scores.get(p.id)!,best)===0),s.dealer);
  const share=Math.floor(amount/eligible.length),remainder=amount%eligible.length;
  eligible.forEach((p,i)=>{p.chips+=share+(i<remainder?1:0);if(!s.winners.includes(p.id))s.winners.push(p.id);});
 }
 const names=s.players.filter(p=>s.winners.includes(p.id)).map(p=>p.name).join(' e ');
 s.note=contenders.length===1?`${names} ficou com o pote.`:`${names} ${s.winners.length===1?'venceu':'dividiram os potes'}.`;
 s.street='showdown';s.turn=null;s.deadline=0;s.deck=[];s.players.forEach(p=>{p.bet=0;p.total=0;});
}
function advance(s:PokerState,now:number,from:number){
 if(live(s).length<=1){settle(s);return;}
 for(let safety=0;safety<5;safety++){
  const actionable=live(s).filter(p=>p.chips>0);
  const needing=actionable.filter(p=>!p.acted||p.bet<s.currentBet);
  if(needing.length&&(actionable.length>1||needing.some(p=>p.bet<s.currentBet))){const next=cycle(needing,from)[0];s.turn=next.id;s.deadline=now+30000;return;}
  if(s.street==='river'){settle(s);return;}
  s.street=s.street==='preflop'?'flop':s.street==='flop'?'turn':'river';
  const count=s.street==='flop'?3:1;s.deck.pop(); // burn
  for(let i=0;i<count;i++)s.board.push(s.deck.pop()!);
  s.currentBet=0;s.raises=0;s.players.forEach(p=>{p.bet=0;p.acted=false;});from=s.dealer;
 }
}
export function expirePoker(s:PokerState,now:number){
 for(const p of s.players)if(now-p.seen>45000&&!p.left){p.left=true;p.folded=true;}
 if(activeHand(s)){
  const current=s.players.find(p=>p.id===s.turn);
  if(live(s).length<=1)settle(s);
  else if(!current||current.left||now>=s.deadline){if(current){if(current.bet<s.currentBet)current.folded=true;current.acted=true;}advance(s,now,current?.seat??s.dealer);}
 }else s.players=s.players.filter(p=>!p.left);
}
export function pokerCommand(s:PokerState,id:string,name:string,action:PokerAction,now:number,randomInt:(max:number)=>number):string{
 let p=s.players.find(p=>p.id===id);
 if(action==='join'){
  if(p&&!p.left)return 'Você já está na mesa.';
  if(p)return 'Espere esta mão terminar para voltar.';
  if(s.players.length>=4)return 'A mesa está cheia. Espere um lugar ficar livre.';
  const seat=[0,1,2,3].find(n=>!s.players.some(p=>p.seat===n))!;
  s.players.push({id,name,seat,chips:1000,cards:[],bet:0,total:0,folded:false,inHand:false,acted:false,seen:now});
  return activeHand(s)?'Você entra na próxima mão.':'Você recebeu 1.000 fichas virtuais gratuitas.';
 }
 if(!p||p.left)return 'Sente à mesa para jogar.';
 if(action==='leave'){p.left=true;p.folded=true;p.acted=true;if(activeHand(s)){if(live(s).length<=1)settle(s);else if(s.turn===id)advance(s,now,p.seat);}else s.players=s.players.filter(q=>q.id!==id);return 'Você saiu da mesa.';}
 if(action==='deal'){
  if(activeHand(s))return 'Esta mão ainda está em andamento.';
  s.players=s.players.filter(q=>!q.left);if(s.players.length<2)return 'Espere mais uma pessoa sentar.';
  s.players.forEach(q=>{if(q.chips===0)q.chips=1000;q.inHand=true;q.folded=false;q.acted=false;q.bet=0;q.total=0;q.cards=[];});
  s.deck=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){const j=randomInt(i+1);[s.deck[i],s.deck[j]]=[s.deck[j],s.deck[i]];}
  s.dealer=cycle(s.players,s.dealer)[0].seat;s.hand++;s.board=[];s.winners=[];s.street='preflop';s.raises=0;s.currentBet=20;s.note='Mão nova. Suas duas cartas são só suas.';
  for(let n=0;n<2;n++)for(const q of cycle(s.players,s.dealer))q.cards.push(s.deck.pop()!);
  const ordered=cycle(s.players,s.dealer),small=s.players.length===2?s.players.find(q=>q.seat===s.dealer)!:ordered[0],big=s.players.length===2?ordered[0]:ordered[1];
  pay(small,10);pay(big,20);advance(s,now,big.seat);return 'Cartas distribuídas.';
 }
 if(!activeHand(s)||s.turn!==id||p.folded||!p.inHand)return 'Espere a sua vez.';
 const due=Math.max(0,s.currentBet-p.bet);
 if(action==='fold')p.folded=true;
 else if(action==='call')pay(p,due);
 else if(action==='raise'){
  if(s.raises>=3||p.chips<due+raiseSize(s)||live(s).filter(q=>q.chips>0).length<2)return 'Não é possível aumentar agora.';
  pay(p,due+raiseSize(s));s.currentBet=p.bet;s.raises++;live(s).forEach(q=>{q.acted=false;});
 }else return 'Ação desconhecida.';
 p.acted=true;advance(s,now,p.seat);return action==='fold'?'Você desistiu desta mão.':action==='raise'?'Aposta aumentada.':due?'Aposta paga.':'Você passou.';
}
export function publicPoker(s:PokerState,id:string){
 const me=s.players.find(p=>p.id===id&&!p.left),playing=activeHand(s),canAct=!!me&&s.turn===id&&playing;
 return {street:s.street,hand:s.hand,board:s.board,dealer:s.dealer,turn:s.turn,deadline:s.deadline,note:s.note,winners:s.winners,pot:s.players.reduce((n,p)=>n+p.total,0),me:me?.id??null,
  players:s.players.map(p=>({id:p.id,name:p.name,seat:p.seat,chips:p.chips,bet:p.bet,folded:p.folded,waiting:!p.inHand,left:!!p.left,cards:p.id===id||(s.street==='showdown'&&!p.folded)?p.cards:[] })),
  canDeal:!!me&&!playing&&s.players.filter(p=>!p.left).length>=2,canAct,canRaise:canAct&&s.raises<3&&me.chips>=Math.max(0,s.currentBet-me.bet)+raiseSize(s)&&live(s).filter(p=>p.chips>0).length>1,
  call:me?Math.min(me.chips,Math.max(0,s.currentBet-me.bet)):0,raise:raiseSize(s)};
}
export type PokerView=ReturnType<typeof publicPoker>;
