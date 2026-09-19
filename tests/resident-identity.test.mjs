import test from 'node:test';
import assert from 'node:assert/strict';
import {residentIdentity} from '../server/residentIdentity.ts';
const secret='fake-test-only-signing-secret';
test('server issues independent anonymous identities and validates their signatures',()=>{
 const a=residentIdentity(undefined,secret,1000),b=residentIdentity(undefined,secret,1000);
 assert.notEqual(a.id,b.id);assert.deepEqual(residentIdentity(a.token,secret,2000),a);
 assert.equal(residentIdentity(a.token,'wrong-secret',2000),null);
 const body=Buffer.from(JSON.stringify({id:b.id,expires:9999999})).toString('base64url');
 assert.equal(residentIdentity(`${body}.${a.token.split('.')[1]}`,secret,2000),null);
 assert.equal(residentIdentity(a.token,secret,86401001),null);
 assert.equal(residentIdentity('bad-token',secret),null);
});
