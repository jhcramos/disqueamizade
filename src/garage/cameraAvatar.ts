import {normalizeAppearance,readSavedAvatar,type Appearance} from './avatarStyle.ts';
let current:{avatar:number;appearance:Appearance}|undefined;
/** The current visit is authoritative, even when this look was never saved. */
export function setCameraAvatar(avatar:number,appearance:unknown){
 const look={avatar,appearance:normalizeAppearance(appearance)};current=look;
 return()=>{if(current===look)current=undefined;};
}
export function readCameraAvatar(){return current??readSavedAvatar();}
