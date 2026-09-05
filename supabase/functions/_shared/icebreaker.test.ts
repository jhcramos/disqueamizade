import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseIcebreakerInput, QUESTIONS } from './icebreaker.ts'
import { moderateText } from './chat.ts'
const id='00000000-0000-4000-8000-000000000001'
test('icebreaker rejects client identity, invalid actions and stale-shaped requests',()=>{
 for(const body of [null,[],{action:'state',roomSlug:'room',userId:id},{action:'reveal',roomSlug:'room'},{action:'answer',roomSlug:'room',text:'hi'},{action:'answer',roomSlug:'room',roundId:id,text:'x'.repeat(161)},{action:'react',roomSlug:'room',roundId:id,answerId:'wrong'}]) assert.throws(()=>parseIcebreakerInput(body))
})
test('icebreaker accepts optional participation and bounded actions',()=>{
 for(const action of ['state','start']) assert.equal(parseIcebreakerInput({action,roomSlug:'room'}).action,action)
 assert.equal(parseIcebreakerInput({action:'answer',roomSlug:'room',roundId:id,text:'Gosto de cozinhar'}).text,'Gosto de cozinhar')
 assert.equal(parseIcebreakerInput({action:'withdraw',roomSlug:'room',roundId:id}).action,'withdraw')
})
test('40 distinct curated questions fit limits and pass server moderation',()=>{
 assert.equal(QUESTIONS.length,40);assert.equal(new Set(QUESTIONS).size,40)
 for(const question of QUESTIONS){assert(question.length<=200);assert.equal(moderateText(question),question)}
})
