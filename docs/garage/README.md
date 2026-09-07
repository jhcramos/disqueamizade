# Garagem experimental

Rota: `/garagem`. A home e as salas existentes permanecem acessíveis; nenhuma implantação é feita por esta alteração.

## O que esta versão entrega

- Entrada com apelido e dez modelos 3D licenciados CC0.
- Cenário raster pré-renderizado com câmera fixa e avatares WebGL animados (composição 2.5D, não uma casa toda modelada).
- Movimento por clique, setas/WASD e controles de toque, limitado ao piso navegável.
- Seleção acessível por lista, modo gráfico leve, tratamento de falha WebGL.
- Convites com aceite/recusa/cancelamento/expiração e chamada individual.
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

Os modelos Kenney são provisórios e muito mais simples que os personagens adultos do desenho aprovado. O fundo preserva a atmosfera, mas esta versão não atinge a fidelidade de personagens da referência. A revisão visual completa está em `design-qa.md`.

### Two-room visit and movement

The room selector switches between garage and living room while retaining the visitor identity and avatar. Presence carries a room identifier; people in the other room are counted in the house but are not shown as nearby. Switching rooms is disabled during a pending invitation or call. A room with no safe arrival position rejects the transition.

Walking stops before another avatar using a swept ground-space collision check. Choose another point on the floor to pass around them; automatic route planning is not implemented. The same movement path handles floor clicks, keyboard, mobile arrows and approach actions. Invitations show a speech bubble above the sender; cameras remain opt-in.

This is a local prototype: simultaneous arrivals are resolved by client identity, not an authoritative game server. Real network latency, online room transitions and large-scale concurrency still require integration/load testing.

### Walking correction and group proposal

Each room now uses its own larger floor outline, excluding furniture. Click walking uses a small A* route to pass around people, with swept collision checks throughout; blocked routes retry at most twice per second. Keyboard movement starts from the current position. Pending invitation bubbles offer the same accept/decline/cancel actions as the sidebar.

See GROUP-CONVERSATIONS.md for the proposed 12-visitor room and 4-person conversation rules. These are proposed limits requiring server-side membership and media authorization work. Current calls remain private pairs. This supersedes the earlier note that automatic route planning is absent.
