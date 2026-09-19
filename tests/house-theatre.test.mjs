import { test } from 'node:test';
import assert from 'node:assert/strict';
import { youtubeId, emptyScreening, changeScreening, parseScreening, playbackTime } from '../src/garage/theatre/model.ts';
test('YouTube links accept only trusted hosts and valid IDs',()=>{
 for(const url of ['https://youtu.be/M7lc1UVf-VE?t=4','https://www.youtube.com/watch?v=M7lc1UVf-VE&list=abc','https://m.youtube.com/shorts/M7lc1UVf-VE','https://youtube.com/live/M7lc1UVf-VE'])assert.equal(youtubeId(url),'M7lc1UVf-VE');
 for(const url of ['javascript:alert(1)','https://youtube.com.evil.com/watch?v=M7lc1UVf-VE','https://evil.com/?v=M7lc1UVf-VE','https://youtube.com@evil.com/watch?v=M7lc1UVf-VE','https://user@youtube.com/watch?v=M7lc1UVf-VE','http://youtube.com/watch?v=M7lc1UVf-VE','https://youtube.com/watch?v=short','https://youtube.com:444/watch?v=M7lc1UVf-VE'])assert.equal(youtubeId(url),null);
});
test('one DJ, guest requests, duplicate limits and playback lifecycle',()=>{
 const a={id:'ana',name:'Ana'},b={id:'bia',name:'Bia'};let s=emptyScreening();
 s=changeScreening(s,{kind:'claim'},a);assert.equal(changeScreening(s,{kind:'claim'},b),s);
 s=changeScreening(s,{kind:'add',id:'clip1',title:'Show',video:'M7lc1UVf-VE'},b);
 assert.equal(changeScreening(s,{kind:'next'},b),s);
 assert.equal(changeScreening(s,{kind:'add',id:'duplicate',title:'Duplo',video:'M7lc1UVf-VE'},a),s);
 s=changeScreening(s,{kind:'next'},a,100000);assert.equal(s.current.title,'Show');assert.equal(playbackTime(s,110000),10);
 s=changeScreening(s,{kind:'pause'},a,120000);assert.equal(playbackTime(s,130000),20);
 s=changeScreening(s,{kind:'resume'},a,140000);assert.equal(playbackTime(s,145000),25);
 assert.equal(changeScreening(s,{kind:'next',expected:'oldclip'},a),s);
 s=changeScreening(s,{kind:'next',expected:'clip1'},a);assert.equal(s.current,null);
 s=changeScreening(s,{kind:'release'},a);assert.equal(s.dj,null);
});
test('queue bounded per sender, removal ownership, untrusted snapshots rejected',()=>{
 const a={id:'a',name:'Ana'},b={id:'b',name:'Bia'};let s=emptyScreening();
 for(let i=0;i<3;i++)s=changeScreening(s,{kind:'add',id:String(i),video:`M7lc1UVf-V${i}`,title:`Video ${i}`},b);
 assert.equal(s.queue.length,3);assert.equal(changeScreening(s,{kind:'add',id:'4',video:'M7lc1UVf-V4',title:'Extra'},b),s);
 assert.equal(changeScreening(s,{kind:'remove',id:'0'},a),s);
 s=changeScreening(s,{kind:'remove',id:'0'},b);assert.equal(s.queue.length,2);
 assert.deepEqual(parseScreening(s),s);
 assert.equal(parseScreening({...s,offset:Infinity}),null);assert.equal(parseScreening({...s,current:{video:'javascript:alert(1)'}}),null);
});

test('server snapshots validate against server time even when a visitor clock is behind',()=>{
 const state={...emptyScreening(),started:200000};
 assert.equal(parseScreening(state,100000),null);
 assert.deepEqual(parseScreening(state,200500),state);
 assert.equal(playbackTime(state,201000),1);
});
