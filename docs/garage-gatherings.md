# Rodas de conversa por ambiente

Garagem: roda do som e papo nas cadeiras. Sala de estar: roda do sofá e cantinho do café. Bar: três mesas. Os pontos usam o piso navegável existente, sem adicionar modelos ou móveis ao cenário.

Os lugares vazios também aparecem no cenário, com pontos numerados e uma faixa de nomes e vagas acima da imagem. Toque em um lugar livre para abrir sua roda; em um ocupado, o painel abre na conversa correspondente. Os pontos têm área de toque de 44 px no celular.

Quem inicia coloca uma placa “Pode chegar” ou “Conversa reservada”. A presença anuncia o local e a ocupação (1–4). Uma pessoa pede para participar, quem iniciou envia o convite e a pessoa confirma. Uma roda não liga câmera nem microfone automaticamente; a entrada de alguém mantém a pausa de mídia já existente. Ao aceitar, o avatar é posicionado em um espaço livre próximo à roda.

Os pedidos expiram em 30 segundos, há intervalo entre pedidos repetidos, e convites pendentes reservam a próxima vaga. Preferências de vídeo e bloqueios continuam sendo respeitados. A placa é removida ao mudar de ambiente, encerrar ou desconectar. A caixinha de assuntos só publica uma pergunta no chat público após clique explícito.

## Limite desta entrega

As rodas usam o transporte local existente (`BroadcastChannel`), entre abas do mesmo navegador. Não conectam dispositivos distintos. A integração online de presença e grupos precisa ser implementada antes de oferecer esse fluxo como encontro online na casa. O modo online não anuncia rodas funcionais.

## Verificação

- `node --test tests/gatherings.test.mjs tests/garage-group.test.mjs tests/garage.test.mjs tests/garage-bar.test.mjs`
- `node tests/garage-gatherings-browser.mjs` com Vite na porta 3000 e Playwright disponível (ou `PLAYWRIGHT_MODULE` apontando para a instalação).
- O teste de navegador usa cinco visitantes sintéticos, recusa qualquer captura de mídia, verifica capacidade, consentimento, privacidade, pergunta pública, celular, sofá, mesas e limpeza de presença.
- `npm run build`
