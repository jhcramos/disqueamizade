import {test} from 'node:test';import assert from 'node:assert/strict';
import {BILLBOARDS,BILLBOARD_DAILY_PRICE,ROAD_LOOP_METRES,billboardAt,billboardContact} from '../src/garage3d/billboards.ts';
import {roadPoint} from '../src/garage3d/vehicles/model.ts';
test('billboards follow 100 metre road milestones outside the driving lane',()=>{
 assert.equal(BILLBOARD_DAILY_PRICE,35);assert.equal(ROAD_LOOP_METRES,368);
 assert.deepEqual(BILLBOARDS.map(b=>b.metres),[0,100,200,300]);
 assert.deepEqual(BILLBOARDS.map(({x,z})=>[x,z]),[[-29,-49],[55,-21],[13,49],[-55,5]]);
 assert.ok(BILLBOARDS.every(b=>!roadPoint(b)));assert.deepEqual(billboardAt(368),billboardAt(0));
});
test('advertising enquiry identifies sign and daily price without collecting payment',()=>{
 const link=decodeURIComponent(billboardContact('outdoor-3'));assert.ok(link.startsWith('mailto:contato@disqueamizade.com.br'));assert.ok(link.includes('outdoor-3'));assert.ok(link.includes('R$ 35 por dia'));
});
