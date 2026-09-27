export const QUESTIONS = [
  {
    id: "musica",
    category: "Leves",
    text: "Qual música sempre melhora o seu dia?",
  },
  {
    id: "domingo",
    category: "Leves",
    text: "Como seria um domingo perfeito para você?",
  },
  {
    id: "comida",
    category: "Leves",
    text: "Que comida tem gosto de casa para você?",
  },
  {
    id: "descoberta",
    category: "Leves",
    text: "O que você descobriu por acaso e adorou?",
  },
  {
    id: "talento",
    category: "Divertidas",
    text: "Qual é o seu talento mais inútil e mais divertido?",
  },
  {
    id: "novela",
    category: "Divertidas",
    text: "Se sua semana fosse uma novela, qual seria o título?",
  },
  {
    id: "layla",
    category: "Divertidas",
    text: "Se a Layla mandasse na casa por um dia, o que mudaria?",
  },
  {
    id: "regra",
    category: "Divertidas",
    text: "Que regra absurda você inventaria para uma festa?",
  },
  {
    id: "amizade",
    category: "Mais profundas",
    text: "Que gesto pequeno faz você se sentir acolhido?",
  },
  {
    id: "aprender",
    category: "Mais profundas",
    text: "O que você gostaria de aprender sem precisar ser bom nisso?",
  },
  {
    id: "mudanca",
    category: "Mais profundas",
    text: "Sobre o que você mudou de ideia nos últimos anos?",
  },
  {
    id: "lembranca",
    category: "Mais profundas",
    text: "Qual lembrança simples você gostaria de reviver?",
  },
] as const;
export function questionById(id: string | null) {
  return QUESTIONS.find((q) => q.id === id);
}
export const PICKUP_LINES = [
  {
    id: "playlist",
    text: "Se a gente fosse uma playlist, qual seria a primeira música?",
    note: "Abre espaço para um gosto em comum. Funciona melhor quando já existe vontade de conversar.",
  },
  {
    id: "cafe",
    text: "Posso te chamar para um café ou começamos debatendo o melhor pão de queijo?",
    note: "O humor é um convite, não uma obrigação. Um “não, obrigada” encerra o convite com respeito.",
  },
  {
    id: "wifi",
    text: "Você é o Wi-Fi? Porque senti uma conexão.",
    note: "É propositalmente brega. Só vale se as duas pessoas se divertirem; não insista para conseguir uma reação.",
  },
  {
    id: "oi",
    text: "Eu ensaiei uma frase incrível. Esqueci. Um oi sincero serve?",
    note: "A graça está na honestidade. Depois do oi, observe se a outra pessoa também quer continuar.",
  },
  {
    id: "livro",
    text: "Essa conversa está boa. Tem próximo capítulo?",
    note: "Um jeito leve de propor continuidade, sem presumir que a pessoa quer um encontro.",
  },
  {
    id: "estrela",
    text: "Seu pai é astronauta? Porque você é uma estrela.",
    note: "Clássica e exagerada. Pode render uma risada ou um “passo”; as duas respostas são válidas.",
  },
];
