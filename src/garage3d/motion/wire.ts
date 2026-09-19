import type {BodyPose} from './pose.ts';
export type WirePose=[number,number,number,number,number];
export const POSE_TTL=3500;
/** Only five bounded joint angles. Landmarks, images and media are never serialized. */
export function parseWirePose(raw:unknown):WirePose|null{
 if(!Array.isArray(raw)||raw.length!==5)return null;
 const bounds=[[-2.65,0],[-2.3,0],[0,2.65],[0,2.3],[-.14,.14]];
 if(!raw.every((n,i)=>typeof n==='number'&&Number.isFinite(n)&&n>=bounds[i][0]&&n<=bounds[i][1]))return null;
 return raw.map(n=>Math.round(n*100)/100) as WirePose;
}
export const packPose=(p:BodyPose)=>parseWirePose([p.left.shoulder,p.left.elbow,p.right.shoulder,p.right.elbow,p.lean]);
export const unpackPose=(p:WirePose):BodyPose=>({left:{shoulder:p[0],elbow:p[1]},right:{shoulder:p[2],elbow:p[3]},lean:p[4]});
