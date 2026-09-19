import test from 'node:test';import assert from 'node:assert/strict';
import {setCameraAvatar,readCameraAvatar} from '../src/garage/cameraAvatar.ts';
test('current visit look wins over storage; old cleanup cannot clear a new look',()=>{
 const a=setCameraAvatar(1,{hairstyle:'bald',hair:'black'});assert.equal(readCameraAvatar().avatar,1);
 const b=setCameraAvatar(7,{hairstyle:'punk',hair:'pink'});a();assert.equal(readCameraAvatar().avatar,7);assert.equal(readCameraAvatar().appearance.hairstyle,'punk');b();assert.notEqual(readCameraAvatar().avatar,7);
});
