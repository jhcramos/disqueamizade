import {EPISODES,type DomesticState} from '../src/garage3d/residents/domestic.ts';
import type {LifeState} from '../src/garage3d/residents/model.ts';
export const DOMESTIC_MODEL='zai-org/GLM-5.3-Flash';
export type EpisodeRewrite={id:string;lines:string[];generatedBy:typeof DOMESTIC_MODEL};
export function validateEpisodeLines(value:unknown,d:DomesticState):string[]|null{
 const lines=(value as {lines?:unknown})?.lines;
 if(!Array.isArray(lines)||lines.length!==EPISODES[d.episode].beats.length)return null;
 if(lines.some(t=>typeof t!=='string'||t.trim().length<4||t.length>180||/[<>]|https?:\/\//i.test(t)))return null;
 return lines.map(t=>t.trim());
}
/** One bounded batch per episode; no visitor data or tool/movement access is sent. */
export async function improviseEpisode(d:DomesticState):Promise<EpisodeRewrite|null>{
 const key=process.env.DEEPINFRA_API_KEY;if(!key||d.phase==='idle'||d.lines||d.beat!==0)return null;
 const episode=EPISODES[d.episode];
 const response=await fetch('https://api.deepinfra.com/v1/openai/chat/completions',{
  method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),
  body:JSON.stringify({model:DOMESTIC_MODEL,reasoning_effort:'low',max_tokens:1800,temperature:.85,messages:[
   {role:'system',content:'Reescreva as falas de uma pequena comédia doméstica original em português brasileiro. Jana e Harold são um casal de moradores virtuais adultos: ela espirituosa, afetuosa e cansada de concentrar as tarefas; ele sonhador, inventivo, reclama mas assume sua parte. Discussões banais, sem crueldade, humilhação, ameaça, estereótipo de gênero ou ruptura. Final com carinho e parceria. Preserve exatamente ordem, sentido, dono de cada fala, tarefa e local informados. Pensamentos são internos, não respostas. Use humor de situação e pequenos contrastes; não copie personagens ou bordões de séries. Não acrescente fatos sobre visitantes, notícias, terceiros nem outras ações. Não anuncie tarefas concluídas antes da hora. Retorne APENAS JSON {"lines":[...]} com uma string por fala, até 180 caracteres cada. Nenhum nome fora de Jana, Harold e Layla.'},
   {role:'user',content:JSON.stringify({title:episode.title,variation:d.cycle,beats:episode.beats.map(b=>({speaker:b.owner==='dora'?'Jana':'Harold',kind:b.kind??'speech',place:b.spot,task:b.task??'conversar',line:b.text}))})},
  ]}),
 });
 if(!response.ok)return null;
 const choice=(await response.json()).choices?.[0];if(choice?.finish_reason!=='stop'||typeof choice?.message?.content!=='string')return null;
 try{const lines=validateEpisodeLines(JSON.parse(choice.message.content),d);return lines?{id:d.id,lines,generatedBy:DOMESTIC_MODEL}:null;}catch{return null;}
}
/** A late answer cannot resurrect a cancelled scene or rewrite a dialogue already underway. */
export function attachEpisodeRewrite(s:LifeState,rewrite:EpisodeRewrite,now:number){
 const d=s.domestic;if(!d||d.id!==rewrite.id||d.phase!=='gather'||d.beat!==0||d.deadline<now||d.lines)return false;
 const lines=validateEpisodeLines(rewrite,d);if(!lines)return false;
 d.lines=lines;d.generatedBy=DOMESTIC_MODEL;return true;
}
