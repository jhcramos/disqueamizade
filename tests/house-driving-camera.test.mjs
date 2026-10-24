import test from 'node:test';
import assert from 'node:assert/strict';
import {followVehicleTurn} from '../src/garage3d/vehicles/driverCamera.ts';
test('camera keeps free-look offset through corners and does not spin at angle wrap',()=>{
 assert.equal(followVehicleTurn(1,null,2),1);
 assert.ok(Math.abs(followVehicleTurn(.3,0,.7)-1)<1e-9);
 assert.ok(Math.abs(followVehicleTurn(.3,Math.PI-.1,-Math.PI+.1)-.5)<1e-9);
 assert.ok(Math.abs(followVehicleTurn(.3,-Math.PI+.1,Math.PI-.1)-.1)<1e-9);
});
