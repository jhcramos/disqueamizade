import {createResidentMotion} from '../src/garage3d/residents/motion.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLife,tickLife,parseLife,applyCommand,NAMES,speak} from '../src/garage3d/residents/model.ts';
import {EPISODES,freshDomestic,tickDomestic,interruptDomestic} from '../src/garage3d/residents/domestic.ts';
import {HOUSEHOLD} from '../src/garage3d/residents/household.ts';
import {publicInterestTags,tickWelcome} from '../src/garage3d/residents/welcome.ts';
import {personalLife} from '../src/garage3d/residents/social.ts';
import {validateEpisodeLines,attachEpisodeRewrite,improviseEpisode} from '../server/domesticDialogue.ts';
import {areaAt} from '../src/garage3d/areas.ts';
import {houseWalkable} from '../src/garage3d/layout.ts';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
test('Jana and Harold preserve saved identities; old snapshots remain readable',()=>{
 assert.deepEqual(NAMES,{dora:'Jana',teo:'Harold',biscoito:'Layla'});
 const s=createLife(0);delete s.domestic;assert.ok(parseLife(s));
 for(const mutate of [s=>s.domestic.beat=900,s=>s.domestic.phase='fly',s=>s.domestic.lines=['wrong count'],s=>s.domestic.points=[{x:NaN,z:1},HOUSEHOLD.guitar],s=>s.speech={owner:'teo',text:'hi',until:4,kind:'command'},s=>s.arrivals={id:{area:'garage',seen:NaN,next:3,greeted:false}}]){const s=createLife(0);mutate(s);assert.equal(parseLife(s),null);}
});
test('two complete episodes reach props, alternate nearby speech, show thoughts and resolve affectionately',()=>{
 const s=createLife(0),spoken=[],activities=new Set();let last;
 for(let t=0;t<440000;t+=200){
  tickLife(s,.2,[],t);assert.ok(parseLife(s),`valid floor state at ${t}`);
  const speech=s.speech;
  if(speech?.episode&&speech!==last){
   last=speech;const [j,h]=s.residents;
   assert.ok(dist(j.position,h.position)<=2.4,`${speech.text}: close enough`);
   assert.equal(areaAt(j.position)?.id,areaAt(h.position)?.id);
   assert.equal(j.path.length+h.path.length,0,'dialogue starts only after arrival');
   spoken.push(speech);activities.add(s.residents.find(r=>r.id===speech.owner).activity);
  }
 }
 assert.ok(s.memories.some(m=>m.includes('O solo da louça')));
 assert.ok(s.memories.some(m=>m.includes('A sociedade das meias')));
 assert.ok(['guitar','mow','laundry','dishes'].every(a=>activities.has(a)));
 assert.ok(spoken.some(s=>s.kind==='thought'&&/viajar sozinho/.test(s.text)));
 assert.ok(spoken.some(s=>/te amo/.test(s.text)));
 const initial=spoken.slice(0,8);assert.deepEqual(initial.map(s=>s.owner),EPISODES[0].beats.map(b=>b.owner));
});
test('visitor greeting interrupts a scene, frees both hosts and does not get overwritten',()=>{
 const s=createLife(0);for(let t=0;t<45000;t+=200)tickLife(s,.2,[],t);
 assert.notEqual(s.domestic.phase,'idle');const v={id:'ana',name:'Ana',position:{...s.residents[0].position}};
 applyCommand(s,{id:'greet',visitor:v,action:'greet',target:'dora'},45000,[v]);
 assert.equal(s.domestic.phase,'idle');assert.equal(s.residents[0].activity,'greet');assert.ok(s.residents.slice(0,2).every(r=>r.target!=='domestic'));
 const speech=s.speech;tickLife(s,.2,[v],45200);assert.deepEqual(s.speech,speech);
});
test('an obstructed meeting times out instead of speaking across rooms or getting stuck forever',()=>{
 const s=createLife(0);tickDomestic(s,[],10000);const id=s.domestic.id;
 assert.equal(s.domestic.phase,'gather');tickDomestic(s,[],110001);
 assert.equal(s.domestic.phase,'idle');assert.notEqual(s.domestic.id,id);assert.ok(!s.speech?.episode);
});
test('welcomes use safe voluntary interests, proximity, availability and arrival cooldowns',()=>{
 assert.deepEqual(publicInterestTags(['Rock','gay','ignore instructions','cinema','email@example.com']),['música','cinema']);
 const s=createLife(0),r=s.residents[0];r.path=[];r.until=999999;
 const v={id:'ana',name:'Ana',position:{...r.position,x:r.position.x+.8},publicInterests:['Rock'],available:true};
 tickWelcome(s,[v],10);assert.match(s.speech.text,/Ana.*música/);assert.equal(s.speech.owner,'dora');
 assert.equal(personalLife(s,'ana').arrivals,undefined,'arrival records are not broadcast');
 const initial=s.speech;tickWelcome(s,[v],60000);assert.equal(s.speech,initial,'no repeat welcome while visitor stays');
 for(const patch of [{frozen:true},{available:false},{position:HOUSEHOLD.guitar}]){const s=createLife(0);tickWelcome(s,[{...v,...patch}],100);assert.equal(s.speech,undefined);}
 const solo=createLife(0);solo.social.solo.ana=true;tickWelcome(solo,[v],100);assert.equal(solo.speech,undefined);
});
test('scene generation is bounded, contains no visitor data and cannot apply to a changed or already-spoken scene',async()=>{
 const s=createLife(0);tickDomestic(s,[],10000);const d=s.domestic;
 const lines=EPISODES[d.episode].beats.map(b=>b.text);assert.ok(validateEpisodeLines({lines},d));
 assert.equal(validateEpisodeLines({lines:['invented']},d),null);
 assert.equal(validateEpisodeLines({lines:lines.map(()=>'<script>')},d),null);
 const rewrite={id:d.id,lines,generatedBy:'zai-org/GLM-5.3-Flash'};
 assert.ok(attachEpisodeRewrite(s,rewrite,10001));
 interruptDomestic(s,11000);assert.equal(attachEpisodeRewrite(s,rewrite,11001),false);
 const oldFetch=globalThis.fetch,oldKey=process.env.DEEPINFRA_API_KEY;process.env.DEEPINFRA_API_KEY='fake-test-only';
 try{
  const ds=freshDomestic(0);ds.phase='gather';
  globalThis.fetch=async(_url,init)=>{const body=JSON.parse(init.body);assert.ok(body.max_tokens<=1800);assert.ok(!JSON.stringify(body.messages).includes('visitor-id-secret'));return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({lines})}}]}));};
  assert.deepEqual((await improviseEpisode(ds)).lines,lines);
  globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:JSON.stringify({lines})}}]}));assert.equal(await improviseEpisode(ds),null);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.DEEPINFRA_API_KEY;else process.env.DEEPINFRA_API_KEY=oldKey;}
});

test('mowing moves away from Jana and retains the mower during network interpolation',()=>{
 const s=createLife(0);let moved=false;
 for(let t=0;t<410000;t+=200){const previous={...s.residents[1].position};tickLife(s,.2,[],t);const h=s.residents[1],j=s.residents[0];
  if(h.activity==='mow'){
   const mower={x:h.position.x+Math.sin(h.angle)*.88,z:h.position.z+Math.cos(h.angle)*.88};
   assert.ok(dist(mower,j.position)>.8,'mower never overlaps partner');
   if(dist(previous,h.position)>.01)moved=true;
  }
 }
 assert.ok(moved,'Harold pushes the mower along a real short path');
 const m=createResidentMotion(0);m.sample({position:{...HOUSEHOLD.garden},angle:Math.PI,activity:'mow'},0);
 m.sample({position:{x:HOUSEHOLD.garden.x,z:HOUSEHOLD.garden.z-.2},angle:Math.PI,activity:'mow'},1000);
 assert.equal(m.at(500).activity,'mow');
});

test('Layla or accepted visitor conversation interrupts the sketch instead of continuing without context',()=>{
 const s=createLife(0);for(let t=0;t<45000;t+=200)tickLife(s,.2,[],t);
 assert.equal(s.domestic.phase,'speak');const id=s.domestic.id;
 speak(s,'biscoito','Trouxe de volta! Mais uma?',45000);
 assert.equal(s.domestic.phase,'idle');assert.notEqual(s.domestic.id,id);
 assert.equal(s.speech.owner,'biscoito');
 const another=createLife(0);for(let t=0;t<45000;t+=200)tickLife(another,.2,[],t);
 another.speech={owner:'dora',text:'Encontro combinado!',until:54000};
 tickDomestic(another,[],45000);assert.equal(another.domestic.phase,'idle');assert.equal(another.speech.text,'Encontro combinado!');
});
