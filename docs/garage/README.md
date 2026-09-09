# Garagem experimental

**Versão atual da câmera:** capacete do avatar sobre corpo e ambiente reais, com prévia privada antes de entrar. A descrição de fundo liso mais abaixo documenta a iteração anterior.

Rota: `/garagem`. A home e as salas existentes permanecem acessíveis; nenhuma implantação é feita por esta alteração.

## O que esta versão entrega

- Entrada com apelido e dez modelos procedurais Vinyl Club: cinco masculinos e cinco femininos, com visuais completos distintos.
- Cenário raster pré-renderizado com câmera fixa e avatares WebGL animados (composição 2.5D, não uma casa toda modelada).
- Movimento por clique, setas/WASD e controles de toque, limitado ao piso navegável.
- Seleção acessível por lista, modo gráfico leve, tratamento de falha WebGL.
- Convites com aceite/recusa/cancelamento/expiração; conversa local com até quatro pessoas e vídeo real. A integração online existente continua individual.
- Câmera e microfone desligados ao entrar. Prévia privada separada da publicação.
- Mídia real via getUserMedia; o avatar nunca substitui a imagem da webcam.

## Testar sem backend

`npm ci`, `npm run dev -- --host 127.0.0.1 --port 3000 --strictPort`, abrir `/garagem`.
Escolher Visita local. Abrir outra aba do mesmo navegador e mesma origem, entrar com outro apelido e aproximar os avatares. Convites usam BroadcastChannel; a chamada usa WebRTC. Não funciona entre computadores neste modo e não representa uma implantação pública.

Bia é explicitamente identificada como avatar de demonstração. Nunca aceita automaticamente ou representa uma pessoa online.

Somente no servidor de desenvolvimento, `?testMedia=1` usa mídia sintética gerada para validar transporte e encerramento sem acessar dispositivos reais. A tela identifica essa condição; o código da fixture não integra o bundle de produção.

## Integração online preparada, ainda não validada neste ambiente

O modo online exige VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (ou chave publicável compatível), VITE_LIVEKIT_URL e VITE_GARAGE_ROOM_SLUG fornecidos pelo ambiente de execução/deployment aprovado. Não colocar segredos no Git ou em arquivos de configuração do protótipo.

VITE_GARAGE_ROOM_SLUG deve apontar para uma sala pública ativa e gratuita existente. Não são criadas salas, alteradas políticas ou publicadas funções automaticamente. Dependências de servidor existentes: private-contact, livekit-token, tabelas e políticas de convites privados.

Posições usam Broadcast; Presence sinaliza participantes. Convites e autorização do vídeo passam pelas funções existentes, com identidade autenticada e convite aceito. A presença visual é informação enviada por clientes, não prova de identidade/proximidade para autorização. Não usar este protótipo em produção sem endurecer a presença e limites, aplicar moderação integrada e validar os serviços.

A integração online não foi exercitada porque este checkout não tem ambiente Supabase/LiveKit configurado. Não foi validada capacidade para mil usuários, celulares físicos ou redes externas. A prévia real da webcam requer a permissão da própria pessoa.

## Validação desta rodada

- TypeScript e build de produção.
- 13 testes existentes de privacidade de câmera; 22 de chat/convites/autorização.
- 6 testes novos: piso, spawn, proximidade, movimento, validação de presença e restauração da pose.
- Navegador: entrada, escolha de avatar, aproximação, duas visitas, convite aceito, transmissão sintética 640x360 nos dois sentidos, encerramento remoto.
- Layout mobile: viewport 390x844 sem overflow horizontal; desktop 1440x1024.

## Direção artística pendente

Os modelos procedurais Vinyl Club são provisórios e mais simples que os personagens do desenho aprovado. O fundo preserva a atmosfera, mas esta versão não atinge a fidelidade de personagens da referência. A revisão visual completa está em `design-qa.md`.

### Two-room visit and movement

The room selector switches between garage and living room while retaining the visitor identity and avatar. Presence carries a room identifier; people in the other room are counted in the house but are not shown as nearby. Switching rooms is disabled during a pending invitation or call. A room with no safe arrival position rejects the transition.

Walking stops before another avatar using a swept ground-space collision check. Choose another point on the floor to pass around them; automatic route planning is not implemented. The same movement path handles floor clicks, keyboard, mobile arrows and approach actions. Invitations show a speech bubble above the sender; cameras remain opt-in.

This is a local prototype: simultaneous arrivals are resolved by client identity, not an authoritative game server. Real network latency, online room transitions and large-scale concurrency still require integration/load testing.

### Walking correction and group proposal

Each room now uses its own larger floor outline, excluding furniture. Click walking uses a small A* route to pass around people, with swept collision checks throughout; blocked routes retry at most twice per second. Keyboard movement starts from the current position. Pending invitation bubbles offer the same accept/decline/cancel actions as the sidebar.

See GROUP-CONVERSATIONS.md for the proposed 12-visitor room and 4-person conversation rules. These are proposed limits requiring server-side membership and media authorization work. Current calls remain private pairs. This supersedes the earlier note that automatic route planning is absent.

### Playful objects

Both rooms now have a kickable low-poly 3D ball, an extra rounded 3D cushion that can be carried/thrown, and dimmable scenery. The garage stereo has an optional original synthesized rhythm and a short dance animation. The living room TV shows a retro test card; the sofa triggers a short staged jump and return to the walkable floor, not persistent free climbing. Buttons on objects and the tray trigger the same actions and automatically approach before interacting.

Cosmetic state uses a separate room-scoped BroadcastChannel in local mode and Supabase Broadcast in configured online mode. Per-object timestamp/id ordering resolves simultaneous updates; snapshots initialize newcomers without replaying old throws. No database migrations were needed. This is ephemeral client-coordinated state, not a server-authoritative physics/ownership system. Room changes drop the local subscription, and the last visitor leaving resets the room on a future visit.

Sound is opt-in per visitor and stops when powered off, when an invitation/call pauses play, or when leaving the component. No camera or microphone access is used by these interactions. Reduced-motion preferences suppress 3D toy flight/performer motion and lighting transitions. Object trajectories stay on the floor map; they do not simulate physical collisions with people.

Verified locally with two visits: ball kick, cushion pickup/throw, shared dimming, stereo power/optional audio controls, dance, TV power restored for a newcomer, and sofa action. The online cosmetic-state adapter was not exercised against a configured deployment. Tests: 19 movement/object tests, 13 camera tests, 22 chat/auth tests; production build passes.

### Vinyl Club, optional intentions and Bar Vinyl (latest)

The live avatar renderer now uses authored rounded Three.js geometry with modular outfits, enlarged expressive heads and sneakers, and blended hip/knee walking and sitting poses. The wardrobe offers 20 outfits and 20 accessories in each collection, usable with either silhouette; six accessory slots may be combined. The mirror supports colors, rotation, apply/cancel and local saved appearance. This is a simplified working interpretation of the Vinyl Club concept, not a claim of matching every detail of the generated illustration. Older Kenney assets and their license are retained but are no longer used by the live renderer.

An optional intention is stored with appearance and carried in presence: dating, friendship, chat, meeting people or leaving things open. Hidden is the default. A labelled icon appears beside the avatar's name; it neither invites another person nor grants camera/microphone consent. Changing only intention does not rebuild 3D geometry. Existing profile intervals read the latest appearance instead of restoring captured old selections.

The new bar is the third room, with three tables of four seats plus three counter stools (15 seats). Each seat has a floor anchor and a sitting pose aligned to the background. Selecting a seat approaches it, sits on arrival, and publishes occupancy; standing or leaving releases the seat. Simultaneous claims converge by visitor identity. This is client-coordinated prototype occupancy, not a server-authoritative reservation system. The bar has separate floor geometry, table obstacles and a smaller personal-space radius suited to its scale. A final movement update publishes arrival even when the last animation frame falls between presence updates.

Bar interactions: shared mood lighting, jukebox power and a toast; jukebox audio is an original opt-in synthesized loop local to each listener. Seats and object actions pause during invitations and calls. The bar entrance asks for an 18+ self-declaration for this visit; this is NOT verified age or a backend access boundary. No explicit adult media was added. Table capacity does not change private calls: video remains two-person; four-person video groups remain future work.

Validation: 33 garage/avatar/bar tests, 13 camera tests and 22 chat/auth tests. Two isolated local browser visits verified table/counter sitting, occupied-seat disabling, standing and room-departure release, shared jukebox/toast, optional intention presence and saved intention after reload. Desktop 1440 px and mobile 390 px screenshots are included; mobile has no horizontal overflow. No physical camera/microphone was used. Cloud concurrency, age enforcement and large-scale load remain unvalidated.

### Collectible avatar refinement and independent hair editor

Corrected the tilted walk: the scene no longer applies a whole-body X rotation before heading changes, and the animator keeps X/Z body rotation upright. Hip/knee animation remains blended. Enlarged rounded heads and round dark eyes move the styling toward the user's collectible-toy direction; the live result remains an authored simplified mesh, not the detailed generated concept.

A dedicated Cabelos tab offers ten independent cuts (raspado, curto, médio ondulado, longo, chanel, cacheado, arrepiado, punk/moicano, rabo de cavalo, coque), plus each base model's default. Cut and color persist independently of body/model and are shared with appearance. Hair cards preview the cut without hats while retaining the selected accessories. Apply/cancel remain visible while the options scroll, and the mirror stays in view on desktop.

Validation: 35 garage/avatar/bar tests plus the existing 13 camera and 22 chat tests (70 total), production build, upright-axis regression across 120 walking/heading frames, and all ten cut geometries. Isolated browser QA verified long/punk appearance, saved cut after reload, cancel preserving the saved cut, walking screenshot, and mobile editor without horizontal overflow. Bar seating/occupancy, jukebox/toast and room departure were rechecked with two visits. Real app captures: avatar-hair-editor.png and avatar-walking-upright.png. These screenshots, rather than the generated illustration, show delivered quality.

### Closer encounters and continuous hair surfaces

Reduced the garage/living collision spacing from 0.105 to 0.052 normalized ground units (bar: 0.048) and the automatic approach target from 0.125 to room spacing plus 0.008. A nearby person can now be approached closely while swept collision still prevents crossing. Invitation consent and camera/microphone rules are unchanged. The approach filter uses the room-specific spacing rather than a separate larger constant.

Replaced separate hair tubes, beads and cones with continuous parametric scalp surfaces, sculpted grooves, continuous long/bob curtains and integrated crest/ponytail/bun forms. Revised eyebrows, subtle eye highlights, smile and hands. This is a live procedural-art refinement; its quality is represented by hair-sculpted.png, not by a promise to equal a generated reference. close-conversation.png shows the actual shorter approach distance.

Validation: 36 garage/avatar/bar tests, 13 camera tests, 22 chat tests (71 total), TypeScript/build, saved/canceled hairstyles and desktop/mobile editor checks. New regression verifies a reachable close approach and non-overlap in each room. Browser QA measured the close encounter from the rendered avatar labels and captured the result. Two-visit bar seating/occupancy and shared interactions rechecked after collision changes.


## Atualização: modelos, acessórios e quatro vídeos locais

A seleção inicial aplica o visual completo de cada um dos dez modelos (cinco masculinos e cinco femininos). O editor mantém todas as combinações disponíveis para qualquer silhueta. Há agora careca, afro volumoso, coques espaciais e punk explosivo, além dos cortes anteriores e cores violeta/turquesa/lima. Cada coleção tem 21 roupas e 21 acessórios, incluindo roupa de obra com faixas refletivas, botas e capacete. Chapéus acomodam o volume do cabelo; remover a peça restaura o corte salvo.

Na Visita local, quem inicia a roda pode convidar mais pessoas próximas até atingir quatro participantes. Os convites têm reserva de vaga e expiram em 30 segundos. Cada participante tem vídeo real e controles independentes; a entrada de uma nova pessoa pausa as câmeras e microfones existentes, exigindo nova escolha para publicar. A saída de quem iniciou encerra a roda. Desconexões, cancelamento e saída liberam os dispositivos e conexões. Mudanças de integrantes também reiniciam a mídia para manter uma única revisão do grupo.

O transporte local usa BroadcastChannel v2 e WebRTC em malha (até três conexões por participante). Teste em até quatro abas da mesma origem/perfil de navegador. Esse modo **não conecta computadores pela internet**. O adaptador online Supabase/LiveKit continua limitado ao contrato existente de convite individual; grupos online exigem autorização e integração de servidor próprias. Não foi realizado teste de carga ou de dispositivos físicos.

Validação atual: 40 testes de garagem/avatar/grupo, 13 de câmera e 22 de chat/autorização (75 no total), TypeScript e build. Cinco visitas isoladas de teste verificaram quatro vídeos sintéticos 640×360 e quatro trilhas de áudio por janela, pausa por mudança de público, exclusão da quinta visita, câmera individual desligada, saída e encerramento de todas as trilhas. Nenhum dispositivo físico foi acessado. Capturas atuais: `avatar-ten-presets.png`, `avatar-hardhat.png` e `four-cameras.png` (esta última identifica a mídia de teste).

Para repetir o cenário de quatro câmeras, com Chrome e Playwright disponíveis, use `node tests/garage-group-browser.mjs` enquanto o servidor de desenvolvimento estiver em `localhost:3000`. Se o Playwright estiver instalado fora do projeto, `PLAYWRIGHT_MODULE` pode apontar para seu módulo. O roteiro recusa capturar mídia se não encontrar o aviso de fixture sintética.


## Bloco Pop e câmera do avatar

Os modelos 1 (Caio) e 6 (Lia) receberam a primeira interpretação 3D funcional da prancha Bloco Pop aprovada: cabeça chanfrada, olhos com esclera, topete/cachos em blocos, mãos geométricas e roupas próprias. Há 22 roupas por coleção, mantendo os acessórios e cortes anteriores. A caminhada continua articulada e vertical. A interpretação procedural ainda é mais simples que a ilustração aprovada; as capturas desta rodada mostram a qualidade real.

Na conversa local, com a câmera desligada, marque **Usar meu avatar na câmera** e então **Ligar câmera**. O vídeo publicado será um canvas opaco com a mesma cabeça 3D, pele, cabelo e acessórios do avatar atual. O rastreador facial existente anima giro lateral, piscadas e abertura da boca. Sem rosto detectado, o fundo permanece opaco; nenhum frame original é publicado. Desligar a câmera, mudar o grupo ou sair encerra a captura e o renderizador. O modelo de rastreamento é carregado sob demanda do próprio site.

O catálogo de máscaras das salas existentes também tem **Meu avatar**, usando o visual salvo na garagem. Essa opção utiliza o compositor de vídeo existente com fundo opaco. O rosto real e o fundo da webcam ficam ocultos neste modo; ele não é uma máscara transparente sobre o ambiente real. A troca exige câmera desligada na conversa local.

Validação: build/TypeScript, 75 testes, quatro chamadas simultâneas preservadas, aproximação na garagem, render de expressões com poses de teste e teste de publicação entre duas abas sem rosto detectado. `tests/garage-avatar-camera-browser.mjs` usa somente mídia sintética; após compressão WebRTC, confirma saída opaca e encerramento remoto. O rastreamento com webcam física, a precisão em diferentes rostos/iluminação e a publicação online ainda precisam de avaliação. Não foi acessada uma câmera ou microfone físico nesta rodada.


## Capacete sobre a câmera real e prévia antes da conversa

Na entrada, **Testar câmera e máscara antes de entrar** abre uma prévia privada. Ela também está disponível dentro da garagem antes de enviar ou aceitar um convite. A captura começa somente em **Ativar prévia privada**, sem conexão com participantes e sem microfone. Escolha **Capacete do avatar** ou **Rosto real**, confira a imagem e use **Usar esta escolha**. Fechar, trocar a opção ou sair da página encerra as capturas. A escolha fica nesta aba, mas entrar no chat nunca liga a câmera automaticamente.

O capacete substitui apenas a região do rosto. Um fundo opaco conservador cobre os pontos faciais sob a cabeça 3D; o resto do frame original continua visível. A detecção e o desenho usam exatamente o mesmo snapshot, sem suavização posicional atrasada para esta máscara. No fluxo local, o canvas só envia frames explicitamente depois da composição completa. Rosto ausente, muito pequeno, parcialmente fora da imagem, giro excessivo ou erro bloqueiam a imagem inteira. Não há fallback automático para vídeo sem máscara.

Durante a conversa local, **Mostrar meu rosto** e **Colocar capacete do avatar** trocam o modo. A transmissão anterior é pausada antes da preparação do novo modo. A opção de capacete é o padrão. A troca não pode reabrir mídia se a composição do grupo tiver mudado entre as etapas. O adaptador online da garagem não transmite vídeo bruto quando o capacete foi escolhido e avisa que esse caminho ainda depende de integração; o catálogo de máscaras das salas existentes usa o compositor próprio.

A máscara não garante anonimato: voz, corpo e ambiente podem identificar uma pessoa, e o rastreamento físico ainda requer avaliação em diferentes rostos, movimentos e iluminação.

Validação atual: TypeScript/build, 41 testes de garagem + 13 de câmera + 22 de chat (76), teste entre duas abas de prévia sem peer connection, retenção da escolha e troca ao vivo nos dois sentidos, encerramento da prévia, bloqueio sem rosto, teste geométrico de cobertura facial com preservação do fundo e layout de 390px sem overflow. Regressão de quatro vídeos/áudios passou. O roteiro é `tests/garage-helmet-browser.mjs`; usa mídia e pose sintéticas, sem câmera física. Capturas: `helmet-private-preview.png` e `helmet-mobile.png`.
