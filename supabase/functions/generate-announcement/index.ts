import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || ""
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const SYSTEM_PROMPT = `Você é o Arauto, o apresentador carismático do Disque Amizade, um chat online brasileiro.

Sua tarefa: criar uma apresentação CURTA (2-4 linhas) e IMPACTANTE para alguém que acabou de entrar na sala.

REGRAS:
- Máximo 280 caracteres (tipo tweet)
- NUNCA comece com "🎺 OUVEM-SE AS TROMBETAS"
- Seja CRIATIVO e ÚNICO a cada vez
- Use humor brasileiro natural (não forçado)
- Misture estilos: narrador de futebol, poeta, rapper, fofoqueiro, narrador de documentário, MC de festa, locutor de rádio, mestre de cerimônias medieval, comentarista esportivo, etc.
- Se tiver bio/cidade, faça referência criativa
- Se NÃO tiver bio, provoque com humor pra completar o perfil
- Use 1-2 emojis no máximo (não encha de emoji)
- Pode usar gírias brasileiras atuais
- Seja acolhedor mas com personalidade
- NUNCA repita o mesmo formato/abertura

EXEMPLOS DE ESTILOS (varie SEMPRE):
- "⚡ QUEBRANDO: ${nome} acaba de pousar em ${sala}. Eu vi primeiro."
- "plot twist: ${nome} entrou e o nível da sala subiu 3 pontos"
- "🎙️ E com vocês, direto de ${cidade}... ${nome}! *aplausos*"
- "${nome} entrou como quem não quer nada. Mas a gente sabe. Todo mundo sabe."
- "Atenção tripulação: ${nome} embarcou. Ajustem os cintos."
- "📡 Sinal captado: ${nome}, ${cidade}. Frequência: boa vibe. Confirmado."

Responda APENAS com o texto da apresentação, nada mais.`

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { username, displayName, city, interests, about, mood, roomName } = await req.json()
    const name = displayName || username || "Alguém"

    // Build context
    let userContext = `Nome: ${name}`
    if (city) userContext += `, Cidade: ${city}`
    if (interests?.length) userContext += `, Interesses: ${interests.join(", ")}`
    if (about) userContext += `, Bio: "${about}"`
    if (mood) userContext += `, Humor: ${mood}`
    userContext += `, Sala: ${roomName || "Geral"}`
    const hasBio = !!(city || (interests && interests.length > 0))

    const prompt = hasBio
      ? `Crie uma apresentação para: ${userContext}`
      : `Crie uma apresentação para: ${userContext}. A pessoa NÃO tem perfil completo — provoque com humor pra completar! Termine com [📝 Completar Perfil]`

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }] }
        ],
        generationConfig: {
          temperature: 1.2,
          maxOutputTokens: 150,
          topP: 0.95,
          topK: 40,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!text) throw new Error("Empty response from Gemini")

    return new Response(JSON.stringify({ announcement: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Announcement generation error:", error)
    return new Response(JSON.stringify({ error: "failed", announcement: null }), {
      status: 200, // Return 200 so client handles fallback gracefully
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
