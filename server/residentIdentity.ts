import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
/** Anonymous identities are issued by the server, never selected by a caller. */
export function residentIdentity(token:unknown,secret:string,now=Date.now()):{id:string;token:string}|null{
 const sign=(body:string)=>createHmac('sha256',secret).update(`house-resident-session-v1:${body}`).digest('base64url');
 if(token===undefined){const id=randomUUID(),body=Buffer.from(JSON.stringify({id,expires:now+86400000})).toString('base64url');return{id,token:`${body}.${sign(body)}`};}
 if(typeof token!=='string'||token.length>400)return null;
 try{const [body,signature,extra]=token.split('.');if(!body||!signature||extra)return null;
 const expected=Buffer.from(sign(body)),actual=Buffer.from(signature);if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;
 const data=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
 return typeof data.id==='string'&&/^[a-f0-9-]{36}$/.test(data.id)&&Number.isFinite(data.expires)&&data.expires>now?{id:data.id,token}:null;
 }catch{return null;}
}
