import type {BodyPose} from './pose.ts';
type LegacyPose=[number,number,number,number,number];
export type WirePose=LegacyPose|[...LegacyPose,number,number,number,number];
export const POSE_TTL=3500;
/** Bounded joint angles only. Accept five-angle captures from older clients. */
export function parseWirePose(raw:unknown):WirePose|null{
 if(!Array.isArray(raw)||(raw.length!==5&&raw.length!==9))return null;
 const bounds=raw.length===5
  ?[[-2.65,0],[-2.3,0],[0,2.65],[0,2.3],[-.14,.14]]
  :[[-2.65,2.65],[-2.3,2.3],[-2.65,2.65],[-2.3,2.3],[-.14,.14],[-1.5,1.2],[-1.5,1.5],[-1.5,1.2],[-1.5,1.5]];
 if(!raw.every((n,i)=>typeof n==='number'&&Number.isFinite(n)&&n>=bounds[i][0]&&n<=bounds[i][1]))return null;
 return raw.map(n=>Math.round(n*100)/100) as WirePose;
}
export const packPose=(p:BodyPose)=>parseWirePose([p.left.shoulder,p.left.elbow,p.right.shoulder,p.right.elbow,p.lean,p.left.forward,p.left.elbowForward,p.right.forward,p.right.elbowForward]);
export const unpackPose=(p:WirePose):BodyPose=>({
 left:{shoulder:p[0],elbow:p[1],forward:p[5]??0,elbowForward:p[6]??0},
 right:{shoulder:p[2],elbow:p[3],forward:p[7]??0,elbowForward:p[8]??0},lean:p[4]
});
