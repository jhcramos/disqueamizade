# Exploração da casa no celular

O ambiente usa a área visível do navegador, respeita a área segura e acompanha mudanças do teclado e orientação. Não depende da API de fullscreen nativo. No desktop, permanece a visão inteira e o layout com painel lateral.

- A câmera aproxima o cenário e acompanha o avatar, mantendo o mesmo sistema de coordenadas e colisões.
- Arrastar desloca a visão sem enviar um destino de caminhada. Tocar no piso usa as coordenadas do cenário transformado para andar e retomar o acompanhamento.
- “Ver ambiente inteiro” oferece uma visão geral; “Voltar para perto” restaura a aproximação. “Voltar ao meu avatar” encerra a exploração manual.
- A barra inferior contém Chat, Rodas, Interagir e Pessoas. Só um painel fica aberto; o chat começa recolhido e mantém indicação de mensagens não lidas.
- Os comandos dos objetos são portados para um painel fora do cenário transformado, evitando que sejam ampliados junto com a casa. Os objetos mantêm suas áreas de toque, e a roleta tem uma apresentação menor.
- Convites de conversa e pedidos para rodas abrem o painel correspondente. Câmera e microfone preservam os controles e o consentimento existentes.

## Verificação

`tests/garage-mobile-explore-browser.mjs`: aproximação, ausência de chat sobreposto na entrada, painéis exclusivos, gesto de arrastar sem caminhar, recentralização, toque no piso na visão geral, troca de ambientes, assentos do bar, paisagem e retorno ao desktop.

`tests/garage-gatherings-browser.mjs`, `tests/garage-room-chat-browser.mjs` e `tests/garage-group-browser.mjs`: regressão das rodas, texto e quatro fluxos de vídeo/áudio com mídia sintética de desenvolvimento.

Os testes usam Playwright e a URL local padrão na porta 3000. A exploração aceita `BASE_URL` para verificar a publicação, sem acionar câmera nem microfone.

O transporte entre participantes continua com as limitações já documentadas do modo de visita local; esta mudança não adiciona comunicação entre dispositivos.
