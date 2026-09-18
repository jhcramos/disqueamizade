import { randomInt } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { VercelResponse } from '@vercel/node';
import { createPoker,expirePoker,pokerCommand,publicPoker,TABLE,type PokerState,type PokerAction } from '../src/garage3d/poker/model.ts';
import type { Visitor } from '../src/garage3d/residents/model.ts';
const actions=new Set(['join','leave','deal','fold','call','raise']);
/** Same world row, independent domain; preserve every field owned by the household. */
export async function handlePoker(body:Record<string,any>,res:VercelResponse,url:string,key:string,identity:{id:string;token:string},visitor:Visitor){
 const command=body.command;
 if(command&&(!actions.has(command.action)||typeof command.id!=='string'||!/^[a-f0-9-]{36}$/.test(command.id)))return res.status(400).json({error:'command'});
 const near=Math.hypot(visitor.position.x-TABLE.x,visitor.position.z-TABLE.z)<2.1;
 if(command&&command.action!=='leave'&&(!near||visitor.frozen))return res.status(400).json({error:'Aproxime-se da mesa de pôquer no bar para jogar.'});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),now=Date.now();
 for(let attempt=0;attempt<5;attempt++){
  const {data,error}=await db.from('house_resident_world').select('revision,payload').eq('id','main').single();
  if(error||!data)return res.status(503).json({error:'A mesa está indisponível. Tente novamente.'});
  const payload=data.payload??{},game:PokerState=payload.poker??createPoker();
  const commands:Record<string,string>=payload.pokerCommands??{};
  const me=game.players.find(p=>p.id===identity.id);
  // Leaving the bar releases the seat; a brief poll failure allows reconnection.
  if(me&&!me.left&&(!near||visitor.frozen)){pokerCommand(game,identity.id,visitor.name,'leave',now,randomInt);}
  expirePoker(game,now);if(me&&!me.left)me.seen=now;
  let result:string|undefined;
  const commandKey=command?`${identity.id}:${command.id}`:'';
  if(command){result=commands[commandKey];if(!result){result=pokerCommand(game,identity.id,visitor.name,command.action as PokerAction,now,randomInt);commands[commandKey]=result;}}
  const {data:written,error:failed}=await db.from('house_resident_world').update({revision:data.revision+1,payload:{...payload,poker:game,pokerCommands:Object.fromEntries(Object.entries(commands).slice(-80))},updated_at:new Date(now).toISOString()}).eq('id','main').eq('revision',data.revision).select('revision');
  if(failed)return res.status(503).json({error:'A mesa está reconectando.'});
  if(!written?.length)continue;
  return res.status(200).json({game:publicPoker(game,identity.id),identity,result,commandId:command?.id});
 }
 return res.status(409).json({error:'A mesa está atualizando. Tente novamente.'});
}
