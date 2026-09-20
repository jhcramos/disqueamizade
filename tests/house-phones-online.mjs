import assert from 'node:assert/strict';
import fs from 'node:fs';
// Read only the public endpoint/key already shipped to visitors. Never log tokens.
const site = 'https://disqueamizade.com.br';
const html = await (await fetch(site)).text();
let key;
for (const match of html.matchAll(/src="([^"]+\.js)"/g)) {
  const js = await (await fetch(new URL(match[1], site))).text();
  for (const jwt of js.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    try { const claim = JSON.parse(Buffer.from(jwt[0].split('.')[1], 'base64url')); if (claim.role === 'anon' && claim.ref === 'uquztttljpswheiikbkw') key = jwt[0]; } catch {}
  }
}
assert.ok(key, 'public configuration missing');
const url = 'https://uquztttljpswheiikbkw.supabase.co';
const users = [];
const headers = token => ({apikey:key, Authorization:`Bearer ${token}`, 'Content-Type':'application/json'});
const call = async (user, room, action='poll', phone=null, cid=null) => {
  const response = await fetch(`${url}/rest/v1/rpc/house_phone_desk`, {method:'POST',headers:headers(user.access_token),body:JSON.stringify({p_tab:user.user.id,p_room:room,p_action:action,p_phone:phone,p_call:cid})});
  return {status:response.status,data:await response.json()};
};
try {
  for (let i=0;i<3;i++) {
    const response = await fetch(`${url}/auth/v1/signup`,{method:'POST',headers:headers(key),body:'{}'});
    assert.equal(response.status,200,'anonymous sign in failed');
    users.push(await response.json());
  }
  const [a,b,c] = users;
  assert.equal((await call(b,'living')).status,200);
  assert.equal((await call(c,'living')).status,200);
  const ringing = await call(a,'garage','call','garage-1');
  assert.equal(ringing.status,200);
  const id = ringing.data.mine.id;
  assert.match(ringing.data.mine.target,/^living-[1-4]$/);
  const answers = await Promise.all([call(b,'living','answer',null,id),call(c,'living','answer',null,id)]);
  assert.equal(answers.filter(x=>x.status===200).length,1,'exactly one answer must win');
  const accepted = await call(a,'garage');
  assert.equal(accepted.data.mine.status,'accepted');
  const winner = accepted.data.mine.peer === b.user.id ? b : c;
  for (const user of [a,winner]) {
    const response = await fetch(`${url}/functions/v1/livekit-token`, {method:'POST',headers:headers(user.access_token),body:JSON.stringify({roomId:accepted.data.mine.roomId,participantName:user.user.id,inviteId:accepted.data.mine.inviteId})});
    assert.equal(response.status,200,'accepted pair must receive a media token');
    const {token} = await response.json(); assert.ok(token);
    const claims = JSON.parse(Buffer.from(token.split('.')[1],'base64url'));
    assert.equal(claims.video.room,accepted.data.mine.roomId);
    assert.equal(claims.sub,user.user.id);
  }
  assert.equal((await call(a,'garage','end')).status,200);
  assert.equal((await call(winner,'living')).data.mine,null);
  const denied = await fetch(`${url}/rest/v1/house_phone_calls?select=id`,{headers:headers(a.access_token)});
  assert.ok(denied.status>=400,'direct table access must be denied');
  console.log('PASS real guest sessions, cross-room ringing, concurrent single winner, LiveKit authorization for both sides, hangup, private table access denied. No media requested.');
} finally {
  for (const user of users) await call(user,'garage','leave').catch(()=>{});
  fs.writeFileSync('/tmp/disque-phone-test-users.json',JSON.stringify(users.map(u=>u.user.id)));
}
