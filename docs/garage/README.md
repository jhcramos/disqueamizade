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
