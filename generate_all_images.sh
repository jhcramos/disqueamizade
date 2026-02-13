#!/bin/bash
DIR=~/clawd/disqueamizade/public/blog-images
mkdir -p "$DIR"
SCRIPT=/opt/homebrew/lib/node_modules/openclaw/skills/nano-banana-pro/scripts/generate_image.py
SUCCESS=0
FAIL=0
FAILED_LIST=""

generate() {
  local fname="$1"
  local prompt="$2"
  echo "--- Generating: $fname ---"
  if uv run "$SCRIPT" --prompt "$prompt" --filename "$DIR/$fname" --resolution 1K 2>&1; then
    if [ -f "$DIR/$fname" ]; then
      SUCCESS=$((SUCCESS+1))
      echo "✅ $fname"
    else
      FAIL=$((FAIL+1))
      FAILED_LIST="$FAILED_LIST $fname"
      echo "❌ $fname (file not created)"
    fi
  else
    FAIL=$((FAIL+1))
    FAILED_LIST="$FAILED_LIST $fname"
    echo "❌ $fname (command failed)"
  fi
}

generate "chat-anonimo-brasil-conversar-sem-identificacao.png" "Modern digital illustration of anonymous chat, silhouettes with speech bubbles, Brazilian colors, purple and teal gradient background"
generate "chat-brasileiros-no-exterior-matar-saudade.png" "Illustration of a Brazilian person abroad video chatting with friends in Brazil, world map background, warm nostalgic tones, green and yellow accents"
generate "chat-cristao-online-comunidade-fe-digital.png" "Warm illustration of diverse people connected through digital devices with subtle cross and faith symbols, peaceful blue and gold tones"
generate "chat-de-voz-online-brasil-conversar-sem-camera.png" "Modern illustration of voice chat, soundwaves and microphone icons, people talking without cameras, vibrant purple and blue"
generate "chat-lgbtq-brasil-espaco-seguro-comunidade.png" "Inclusive illustration of diverse LGBTQ plus people chatting online, rainbow accents, safe space vibes, modern and welcoming"
generate "chat-online-belem-para-amazonia.png" "Digital illustration of Belem cityscape with Ver-o-Peso market and Amazonian elements, people chatting online, tropical greens and blues"
generate "chat-online-brasilia-capital-federal-conectada.png" "Illustration of Brasilia iconic architecture congress cathedral with digital connection lines and chat bubbles, modern blue tones"
generate "chat-online-campinas-interior-sao-paulo.png" "Illustration of Campinas cityscape with tech university vibes, people connected via chat, orange and teal tones"
generate "chat-online-campo-grande-mato-grosso-do-sul.png" "Illustration of Campo Grande with Pantanal wildlife elements, people chatting online, green and earth tones"
generate "chat-online-celular-como-usar-mobile.png" "Modern illustration of hands holding smartphone with video chat interface, clean UI, vibrant colors"
generate "chat-online-cuiaba-mato-grosso-centro-oeste.png" "Illustration of Cuiaba with cerrado landscape elements, digital connections, warm earthy and golden tones"
generate "chat-online-florianopolis-santa-catarina.png" "Illustration of Florianopolis beaches and Hercilio Luz bridge with chat bubbles, ocean blue and sunset tones"
generate "chat-online-fortaleza-ceara-nordeste.png" "Illustration of Fortaleza beachfront and jangadas with digital chat elements, tropical turquoise and orange"
generate "chat-online-goiania-goias-cerrado.png" "Illustration of Goiania cityscape with cerrado flowers, people chatting online, warm red and green tones"
generate "chat-online-gratis-sem-baixar-aplicativo-navegador.png" "Modern illustration of browser window with video chat, no download icons, clean and accessible, blue and white"
generate "chat-online-joao-pessoa-paraiba.png" "Illustration of Joao Pessoa with Ponta do Seixas lighthouse and beaches, chat connections, sunrise golden tones"
generate "chat-online-manaus-norte-brasil-conectado.png" "Illustration of Manaus with Teatro Amazonas and rainforest, digital connections, lush green and gold"
generate "chat-online-natal-rio-grande-norte-nordeste.png" "Illustration of Natal with Forte dos Reis Magos and dunes, chat elements, warm sand and blue tones"
generate "chat-online-porto-alegre-gauchos.png" "Illustration of Porto Alegre with Guaiba river and gaucho culture elements, chat connections, wine red and blue"
generate "chat-online-recife-pernambuco-cultura.png" "Illustration of Recife with Marco Zero and frevo elements, digital chat bubbles, vibrant carnival colors"
generate "chat-online-salvador-bahia-axe-digital.png" "Illustration of Salvador Pelourinho and Bahian culture with digital chat elements, warm yellow and blue"
generate "chat-online-sao-luis-maranhao-nordeste.png" "Illustration of Sao Luis colonial architecture with azulejos and chat bubbles, blue and white Portuguese tile aesthetic"
generate "chat-online-sem-cadastro-entrar-conversar-agora.png" "Modern illustration of instant access, open door to video chat, no forms or signup, green go-button vibes"
generate "chat-online-vitoria-espirito-santo-capixabas.png" "Illustration of Vitoria with Penedo monastery and beaches, chat connections, ocean blue and green"
generate "chat-online-vs-redes-sociais-comparativo-2026.png" "Split illustration comparing chat rooms vs social media feeds, versus symbol, modern infographic style"
generate "chat-para-casais-atividades-online-juntos.png" "Warm illustration of a couple doing activities together via video chat, hearts and fun elements, pink and purple"
generate "chat-para-estudantes-universitarios-brasil.png" "Illustration of university students chatting online with books and laptops, campus vibes, youthful blue and orange"
generate "chat-para-gamers-brasil-jogadores-online.png" "Gaming-themed illustration with controllers, headsets and chat interface, neon purple and green, esports vibes"
generate "chat-para-idosos-terceira-idade-combater-solidao.png" "Warm illustration of elderly person happily video chatting, grandparent vibes, soft warm golden tones"
generate "chat-para-praticar-idiomas-intercambio-digital.png" "Illustration of people speaking different languages via chat, flag icons and speech bubbles, colorful international"
generate "como-escolher-melhor-sala-de-chat-online.png" "Modern illustration of someone choosing between different chat room doors and options, decision-making, blue and purple"
generate "como-evitar-golpes-em-chats-online-dicas-seguranca.png" "Security-themed illustration with shield, warning signs and safe chat icons, red alert accents on blue"
generate "como-superar-timidez-em-chats-online-passo-a-passo.png" "Gentle illustration of shy person gradually opening up in chat, butterfly emerging, soft pastel tones"
generate "conhecer-pessoas-online-dicas-2026.png" "Modern illustration of diverse people connecting through screens, friendly and welcoming, warm multicolor"
generate "futuro-do-chat-online-tendencias-2026-2030.png" "Futuristic illustration of chat technology evolution, holographic displays, AI elements, sci-fi blue and purple"
generate "melhor-chat-online-2026-ranking-sites-brasil.png" "Trophy and ranking podium with chat platform icons, best-of list style, gold and blue"
generate "privacidade-em-chat-online-guia-completo-2026.png" "Lock and privacy shield over chat interface, data protection theme, secure green and dark blue"
generate "relacionamentos-que-comecaram-no-chat-online.png" "Romantic illustration of two people who met through chat, heart connection, warm pink and red sunset"
generate "roleta-de-chat-como-funciona-por-que-vicia.png" "Dynamic illustration of chat roulette wheel spinning with video screens, exciting and fun, vibrant multicolor"
generate "saude-mental-chat-online-combater-solidao.png" "Calming illustration of mental health and connection, brain with heart, soothing teal and green"
generate "trabalho-remoto-solidao-chat-online-solucao.png" "Illustration of remote worker finding community through chat, home office to social connection, warm blue"
generate "videochamada-online-gratis-sem-cadastro.png" "Clean illustration of free video call starting instantly, play button and camera icon, bright green and white"

echo ""
echo "========================================="
echo "DONE: $SUCCESS succeeded, $FAIL failed"
if [ -n "$FAILED_LIST" ]; then
  echo "Failed:$FAILED_LIST"
fi
echo "========================================="
