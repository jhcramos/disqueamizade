import type {VercelRequest,VercelResponse} from '@vercel/node';
import {createClient} from '@supabase/supabase-js';
import {residentIdentity} from './residentIdentity.ts';
import {emptyNetwork,exchangeNetwork,type NetworkState} from './houseNetwork.ts';
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'method'});
 if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({error:'origin'});}catch{return res.status(403).json({error:'origin'});}}
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return res.status(503).json({error:'unavailable'});
 const body=req.body;if(!body||JSON.stringify(body).length>200000)return res.status(400).json({error:'input'});
 const token=req.headers['x-house-session'];
 if(body.hello!==true&&!token)return res.status(401).json({error:'session'});
 const identity=residentIdentity(token,key);if(!identity)return res.status(401).json({error:'session'});
 if(body.hello===true)return res.status(200).json({token:identity.token});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 try{for(let attempt=0;attempt<5;attempt++){
  const {data,error}=await db.from('house_resident_world').select('revision,payload').eq('id','main').single();
  if(error||!data)return res.status(503).json({error:'unavailable'});
  const network=(data.payload.network??emptyNetwork()) as NetworkState;
  let result;try{result=exchangeNetwork(network,identity.id,body,Date.now());}catch(e){const reason=(e as Error).message;return res.status(reason==='identity'?403:reason==='slow_down'||reason==='capacity'?429:400).json({error:reason});}
  const {data:written,error:failed}=await db.from('house_resident_world').update({revision:data.revision+1,payload:{...data.payload,network},updated_at:new Date().toISOString()}).eq('id','main').eq('revision',data.revision).select('revision');
  if(failed)return res.status(503).json({error:'unavailable'});if(!written?.length)continue;
  return res.status(200).json(result);
 }return res.status(409).json({error:'retry'});
 }catch{return res.status(503).json({error:'unavailable'});}
}
