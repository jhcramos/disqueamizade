import { ChatError } from './chat.ts'
export const QUESTIONS = [
 'Qual habilidade completamente inútil você tem?', 'Qual comida você defenderia em qualquer discussão?',
 'Qual compra barata fez você feliz demais?', 'Qual música você sabe quase inteira?',
 'Qual personagem de desenho combina com você?', 'Qual mania engraçada você tem?',
 'Qual objeto da sua casa você levaria para uma ilha?', 'Qual filme você assiste de novo sem cansar?',
 'Qual era sua brincadeira favorita na infância?', 'Que nome você daria a uma banda sua?',
 'Qual sabor de sorvete merece mais reconhecimento?', 'Qual invenção simples facilitaria seu dia?',
 'Qual talento você gostaria de aprender só por diversão?', 'Qual animal seria um ótimo colega de casa?',
 'Qual assunto faz você perder a noção do tempo?', 'Qual passeio simples você adora?',
 'Qual coisa pequena melhora seu dia?', 'Qual lugar você gostaria de conhecer?',
 'Qual hobby você tem vontade de experimentar?', 'Qual cheiro lembra uma coisa boa?',
 'Qual prato você gosta de preparar?', 'Qual jogo marcou uma época da sua vida?',
 'Qual seria seu programa perfeito num dia de chuva?', 'Qual música combina com uma viagem?',
 'Qual conselho simples já foi útil para você?', 'Qual aprendizado recente te deixou contente?',
 'Qual atitude faz você se sentir bem recebido?', 'Qual lembrança de amizade te faz sorrir?',
 'Qual pequena conquista você gostaria de celebrar?', 'Qual tradição você gosta de manter?',
 'Qual coisa você achava difícil e aprendeu?', 'Qual atividade você gostaria de fazer com amigos?',
 'Qual presente simples você adorou receber?', 'Qual qualidade você aprecia numa amizade?',
 'Qual programa você apresentaria na televisão?', 'Qual seria o nome do seu restaurante?',
 'Qual superpoder seria útil nas tarefas de casa?', 'Qual expressão você fala o tempo todo?',
 'Qual objeto antigo você ainda gosta de usar?', 'Qual tema você escolheria para uma festa?',
] as const
export function parseIcebreakerInput(body: unknown) {
 if (!body || typeof body!=='object' || Array.isArray(body)) throw new ChatError('invalid_request',400)
 const b=body as Record<string,unknown>
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
 if(Object.keys(b).some(k=>!['action','roomSlug','roundId','text','answerId'].includes(k)) ||
  typeof b.roomSlug!=='string' || b.roomSlug!==b.roomSlug.trim() || !b.roomSlug || b.roomSlug.length>120 ||
  typeof b.action!=='string' || !['state','start','answer','withdraw','react'].includes(b.action) ||
  (b.roundId!==undefined && (typeof b.roundId!=='string'||!uuid.test(b.roundId))) ||
  (b.answerId!==undefined && (typeof b.answerId!=='string'||!uuid.test(b.answerId))) ||
  (b.text!==undefined && (typeof b.text!=='string'||!b.text.trim()||b.text.length>160)) ||
  (['answer','withdraw','react'].includes(b.action)&&!b.roundId) ||
  (b.action==='answer'&&!b.text)||(b.action==='react'&&!b.answerId)) throw new ChatError('invalid_request',400)
 return {action:b.action,roomSlug:b.roomSlug,roundId:b.roundId as string|undefined,text:b.text as string|undefined,answerId:b.answerId as string|undefined}
}
