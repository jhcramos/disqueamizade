# Casa 3D — experiência principal

A entrada pública continua em `/garagem`; `/garagem-3d` redireciona para ela. A home já encaminha para essa entrada. A seleção de avatar, conta e amigos, chat público, mensagens privadas, convites, máscaras e chamadas continuam sob `GaragePage`. `HouseScene` adapta esses dados para a cena tridimensional, sem um segundo estado de sessão.

A casa abre com a câmera próxima ao avatar; “Casa inteira” permite ver os três ambientes: garagem ao fundo, sala à frente à esquerda e bar à direita, numa única cena. Há passagens navegáveis, 8 assentos na garagem, 8 na sala e 15 no bar (três mesas de quatro e três bancos no balcão). Os 12 telefones ficam sobre móveis. Entrar no bar, por menu ou pelo piso, exige a confirmação de idade existente. Os assentos físicos não alteram o limite de quatro participantes da conversa.

As posições de presença são normalizadas por ambiente e convertidas para o mapa global em `coordinates.ts`. Colisões, assentos, pontos de conversa, nascimento e animações usam esse mapa. As abordagens de cadeiras podem compartilhar uma passagem; os avatares sentados usam a posição e altura física do móvel. A troca de ambiente desfaz a pose sentada. Canais de presença e brincadeiras têm nova versão para não misturar coordenadas de abas antigas.

O botão “Ligar” aparece a até 1,15 unidade de um telefone do ambiente atual. O aparelho abre o `HousePhones` existente, com o número correto e o fluxo de Supabase/LiveKit; a cena não simula uma chamada. Os telefones que recebem chamadas balançam. Câmera e microfone continuam desligados até consentimento. O teste privado de câmera e máscara permanece disponível antes de conversar.

“Primeira pessoa” usa perspectiva na altura dos olhos, esconde o próprio avatar e restaura tetos e paredes externas da maquete. Arrastar gira o olhar; W/A/S/D e controles de toque movimentam; Esc volta à visão geral. Colisões usam pequenos passos. Perda de foco e abertura de conversas interrompem controles. No celular, a casa ocupa a área principal, com chat, rodas, pessoas e interações no painel inferior.

Bola, almofada, luzes, dança, som, TV e controles do bar mantêm os eventos existentes. Objetos móveis agora são renderizados no mapa 3D. O áudio exige ativação explícita. Cartas de perguntas oferecem assuntos sem publicar automaticamente no chat.

## Disponibilidade de rede

Esta promoção do cenário **não ativa presença online pública entre navegadores**. A entrada permanece com a disponibilidade anterior: exploração e presença/conversas entre abas no transporte local; o modo online continua restrito às ferramentas de desenvolvimento. Os avisos existentes de disponibilidade permanecem. Os telefones têm serviço online próprio e dependem da configuração e disponibilidade desse serviço. Cadastro/perfil mantêm o serviço existente. Não houve migração de banco ou alteração de permissões nesta entrega.

## Verificação

- Testes unitários: mapa, colisões, todos os assentos, telefones, coordenadas, presença, grupos e privacidade de câmera.
- `garage3d-browser.mjs`: entrada principal, 31 assentos e altura do quadril, troca de cômodos, luzes, diálogo real do telefone e largura mobile.
- `garage3d-exploration-browser.mjs`: proximidade, primeira pessoa, teclado, arraste, controles mobile, dança, áudio opt-in e cartas.
- `house-transition-browser.mjs`: redirecionamento antigo, travessia física da porta, atualização de ambiente, confirmação 18+ e mídia desligada.
- `garage-room-chat-browser.mjs`, `garage-gatherings-browser.mjs` e `garage-group-browser.mjs`: chat e isolamento de salas, convites/aceites/capacidade, quatro vídeos e áudios com fontes de teste, encerramento das trilhas.

A renderização agrupa peças fixas por material, limita a resolução e respeita movimento reduzido. O modo de menor qualidade desliga sombras e reduz a resolução sem recriar a sessão. Testes de viewport mobile em Chromium não substituem avaliação em aparelhos físicos. O acabamento 3D continua sendo uma interpretação da referência, não uma reprodução idêntica.

## Espaço de conversa

Os nomes usam uma etiqueta discreta acima da cabeça; ícones pequenos mantêm a indicação de mensagem/vídeo e as preferências completas estão no perfil. Mensagens temporárias crescem acima da etiqueta. Placas de móveis próximas da projeção de uma pessoa ficam ocultas para não cobri-la. No enquadramento próximo da garagem, a divisória da sala fica translúcida; a colisão da passagem permanece igual.

A barra “Puxe uma cadeira” foi retirada. No desktop, “Conversas” e “Interagir” abrem painéis compactos sobre a cena. Pedidos de entrada em uma roda abrem o painel de conversas automaticamente. A tela cheia mantém a casa e o chat lado a lado; solicita fullscreen nativo quando disponível e usa o layout imersivo como alternativa. No celular, o chat inferior reduz a área do cenário e evita cobrir o personagem.

`house-workspace-browser.mjs` verifica zoom inicial, afastamento dos balões em relação à cabeça, painéis recolhidos, abertura de rodas, tela cheia com chat ao lado, saída e layout mobile.
