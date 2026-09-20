import test from 'node:test';
import assert from 'node:assert/strict';
import {createPoker,pokerCommand,publicPoker,expirePoker,rankHand} from '../src/garage3d/poker/model.ts';
const c=(rank,suit=0)=>(rank-2)+13*suit;
const act=(s,id,action,now=1000)=>pokerCommand(s,id,id,action,now,n=>Math.floor(n/2));
const join=(n=2)=>{const s=createPoker();for(let i=0;i<n;i++)act(s,`p${i}`,'join');return s;};
test('ranking handles wheel, kickers, full houses, flush and best 5 of 7',()=>{
 assert.deepEqual(rankHand([c(14),c(2,1),c(3,2),c(4,3),c(5)]),[4,5]);
 assert.deepEqual(rankHand([c(10),c(11),c(12),c(13),c(14),c(2,1),c(3,2)]),[8,14]);
 assert.deepEqual(rankHand([c(14),c(14,1),c(14,2),c(13),c(13,1),c(12),c(12,1)]),[6,14,13]);
 assert.deepEqual(rankHand([c(9),c(9,1),c(14,2),c(13,3),c(7)]),[1,9,14,13,7]);
});
test('server deal, heads-up blinds and turn order; private cards never leave via public views',()=>{
 const s=join();act(s,'p0','deal');assert.equal(s.dealer,0);assert.equal(s.turn,'p0');assert.equal(s.players[0].bet,10);assert.equal(s.players[1].bet,20);
 assert.equal(new Set([...s.deck,...s.players.flatMap(p=>p.cards)]).size,52);
 const v=publicPoker(s,'p0');assert.equal(v.players[0].cards.length,2);assert.equal(v.players[1].cards.length,0);assert.equal(v.deck,undefined);
 assert.ok(publicPoker(s,'watcher').players.every(p=>p.cards.length===0));
 const before=structuredClone(s);assert.match(act(s,'p1','raise'),/vez/);assert.deepEqual(s,before);
 act(s,'p0','call');assert.equal(s.turn,'p1');act(s,'p1','call');assert.equal(s.street,'flop');assert.equal(s.turn,'p1');
});
test('four seats, fixed raises, fold winner and chips conserved',()=>{
 const s=join(4);assert.match(act(s,'extra','join'),/cheia/);act(s,'p0','deal');assert.equal(s.turn,'p3');
 const expected=4000;
 for(let i=0;i<3;i++)act(s,s.turn,'raise');assert.equal(s.raises,3);assert.equal(publicPoker(s,s.turn).canRaise,false);
 while(s.turn)act(s,s.turn,'fold');assert.equal(s.street,'showdown');assert.equal(s.players.reduce((n,p)=>n+p.chips,0),expected);
 assert.equal(s.winners.length,1);assert.ok(publicPoker(s,'watcher').players.filter(p=>p.folded).every(p=>p.cards.length===0));
});
test('all-in side pots, ties and odd chips are settled without minting chips',()=>{
 const s=join(3);act(s,'p0','deal');s.street='river';s.board=[c(2),c(3,1),c(7,2),c(9,3),c(11)];s.currentBet=300;
 const cards=[[c(14),c(14,1)],[c(13),c(13,1)],[c(12),c(12,1)]];
 s.players.forEach((p,i)=>{p.cards=cards[i];p.total=i===0?100:300;p.bet=p.total;p.chips=0;p.acted=true;});s.turn='p2';
 act(s,'p2','call');assert.equal(s.players[0].chips,300);assert.equal(s.players[1].chips,400);assert.equal(s.players[2].chips,0);
 const t=join(3);act(t,'p0','deal');t.street='river';t.board=[10,11,12,9,8];t.currentBet=5;t.turn='p1';
 t.players.forEach(p=>{p.bet=5;p.total=5;p.chips=0;p.acted=true;});t.players[2].folded=true;
 act(t,'p1','call');assert.equal(t.players[0].chips+t.players[1].chips,15);assert.equal(t.players[1].chips,8,'Odd chip starts left of dealer');
});
test('all-in calls run remaining board and disconnected players release seats',()=>{
 const s=join();s.players[0].chips=10;s.players[1].chips=20;act(s,'p0','deal');
 assert.equal(s.street,'showdown');assert.equal(s.board.length,5);assert.equal(s.players.reduce((n,p)=>n+p.chips,0),30);
 const t=join();act(t,'p0','deal');expirePoker(t,32000);assert.equal(t.street,'showdown');assert.equal(t.winners[0],'p1');
 expirePoker(t,50000);assert.equal(t.players.length,0);
});
test('joining mid-hand waits and leaving current turn advances play',()=>{
 const s=join(3);act(s,'p0','deal');act(s,'new','join');assert.equal(s.players[3].inHand,false);
 const current=s.turn;act(s,current,'leave');assert.notEqual(s.turn,current);assert.equal(s.players.find(p=>p.id===current).folded,true);
});
test('many complete hands conserve chips and never deadlock',()=>{
 for(let seed=1;seed<=40;seed++){
  const s=join(4);s.players.forEach((p,i)=>{p.chips=10+((seed*43+i*79)%200);});const total=s.players.reduce((n,p)=>n+p.chips,0);act(s,'p0','deal');
  let steps=0;while(s.turn&&steps++<100){const view=publicPoker(s,s.turn);act(s,s.turn,view.canRaise&&(steps+seed)%4===0?'raise':(steps+seed)%7===0?'fold':'call');}
  assert.equal(s.street,'showdown');assert.equal(s.players.reduce((n,p)=>n+p.chips,0),total);assert.ok(s.players.every(p=>p.chips>=0));
 }
});
