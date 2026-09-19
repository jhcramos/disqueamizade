# Movimentos opcionais do avatar

Na casa, abra **Movimentar avatar · teste** e escolha **Ativar câmera só para movimentos**. Enquadre ombros, cotovelos e mãos, fique parado no cenário e experimente acenar/levantar os braços. A prévia é espelhada. **Parar e desligar câmera** retorna suavemente às animações normais. O recurso não guarda preferência de ativação.

Esta primeira versão anima braços, cotovelos e uma pequena inclinação do tronco no próprio aparelho, com compartilhamento opcional no mesmo ambiente. Não transmite vídeo ou landmarks aos outros visitantes, não usa microfone e não chama Jev/GLM. Pernas continuam com as animações existentes. Caminhar, sentar e carregar objetos têm prioridade. Iniciar conversa/pôquer, ocultar a aba ou sair da página encerra o teste. A câmera do chat tem controle separado.

O runtime MediaPipe já instalado é copiado para o site pelo build. O modelo Pose Landmarker Lite float16 v1 é baixado do Google somente após ativar. A inferência roda em um worker clássico com uma imagem por vez, sem segmentação, com teto de 12 leituras/s. Há redução para 6 leituras/s e margem de descanso proporcional ao tempo de processamento; a frequência real pode ser menor. Leituras acima de 200ms por 12 amostras após aquecimento, travamento de 5s ou três janelas de 2s abaixo de 15fps encerram o teste. Sem suporte a worker/OffscreenCanvas, mantém-se a animação normal, sem fallback bloqueante na interface.

## Compartilhar gestos

Marque **Compartilhar meus gestos com a sala** para transmitir nove ângulos quantizados: dois eixos por ombro e cotovelo, mais inclinação do tronco. A opção começa desligada e não é gravada entre visitas. Desmarcá-la encerra o envio e mantém a prévia privada; parar a câmera, mudar para uma atividade incompatível ou ocultar a aba também interrompe o envio. A outra pessoa não precisa ligar câmera alguma.

O canal de dados LiveKit transmite até 12 amostras por segundo. Quando indisponível, o cliente prepara até quatro amostras por segundo, coalescidas na conexão HTTP existente (aproximadamente uma atualização por segundo, sujeita à rede). A animação remota interpola os ângulos. A interface informa quando está usando a conexão alternativa.

O servidor valida valores finitos e limites, fixa a identidade pelo visitante autenticado, restringe ao ambiente e apaga ângulos sem atualização após 3,5 segundos. Mantém só a amostra mais recente e um marcador monotônico para descartar repetições. Amostras não entram no histórico do chat. Andar, sentar, dançar, carregar objetos e conversar têm prioridade sobre o gesto capturado. Em primeira pessoa o próprio corpo continua oculto; os outros participantes veem os braços do seu avatar.

## Desligar/reverter

- Visitante: **Parar e desligar câmera** ou **Fechar**. Tracks, worker, temporizadores e monitor de frames são encerrados. Permissão que chega depois de cancelar também é liberada.
- Só a propagação: configurar `VITE_ENABLE_AVATAR_MOTION_SHARING=false` e republicar mantém a prévia local e desliga envio/recepção de gestos.
- Produto: configurar `VITE_ENABLE_AVATAR_MOTION=false` e refazer o deploy remove a entrada. Nenhum modelo é carregado sem ativação. O lançamento longo da Layla é independente e pode continuar ativo.
- Não há migração de banco, dependência nova, vídeo gravado ou custo de tokens.

## Verificação

`node --test tests/avatar-motion.test.mjs tests/layla-fetch.test.mjs tests/camera-privacy.test.mjs`

`PLAYWRIGHT_MODULE=/caminho/playwright/index.mjs node tests/avatar-motion-browser.mjs`

O teste de navegador usa câmera artificial para confirmar que o modelo real executa no worker, que parar libera os tracks e que cancelar durante permissão não deixa a câmera aberta. A retargetização usa landmarks sintéticos nos testes unitários. Isso não mede precisão de gestos humanos, aquecimento ou desempenho de um iPhone/Android real; esses pontos exigem o teste opt-in no aparelho.

Referência: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js

O teste `tests/avatar-motion-sharing-browser.mjs` verifica duas sessões isoladas, opção desligada por padrão, transmissão de apenas nove números, animação real do avatar remoto, retorno suave ao repouso e liberação da câmera. Usa câmera artificial e resultado de detecção sintético; não mede a qualidade de reconhecimento de gestos humanos. Pode ser executado com `LIVE_HOUSE=1 BASE_URL=https://disqueamizade.com.br` para validar o servidor publicado.

## Bolinha

Layla recebe lançamentos de até 5 unidades da casa, antes limitados a 1,8. O código busca a maior distância livre entre 24 direções, reduzindo o alcance perto de móveis/paredes. Verifica o trajeto e a rota da cachorra, evita aterrissar sobre visitantes e conserva a reserva e a devolução da única bolinha.

## Canal rápido

LiveKit transmite apenas nove ângulos, até 12 vezes por segundo, em um canal de dados por ambiente. Tokens vinculados ao visitante não permitem publicar ou assinar câmera/microfone. A consulta HTTP continua como alternativa. Mensagens de parada são confiáveis; amostras intermediárias usam entrega sem retransmissão para não formar fila. A interface indica quando o canal rápido está conectado. Esta conexão usa o serviço LiveKit existente e conta como conexão de participante, mesmo sem vídeo.

Desative com `VITE_ENABLE_AVATAR_MOTION_REALTIME=false` e publique novamente para retornar apenas ao transporte anterior. O teste `avatar-motion-sharing-browser.mjs` aceita `EXPECT_REALTIME=1 LIVE_HOUSE=1` para verificar a mudança visível abaixo de 900 ms; medições dependem da rede e aparelho.

## Braços em profundidade e aceno

O mesmo Pose Landmarker Lite fornece landmarks 3D estimados. São usados somente no aparelho para calcular a direção do ombro e o antebraço relativo a ele: braços à frente, cotovelos em profundidade e movimento lateral do antebraço ao dar tchau. Não carrega outro modelo e não reconhece dedos individualmente. Ombro/cotovelo oculto volta ao repouso; punho oculto relaxa o antebraço. Na ausência de coordenadas 3D válidas, mantém o mapeamento plano anterior.

Os pivôs de captura são separados dos pivôs da caminhada para evitar acumulação de rotação e preservar sentar/carregar objetos. Mensagens antigas de cinco ângulos continuam aceitas, com profundidade zero; abas antigas devem ser atualizadas para receber os nove ângulos novos.

Teste de qualidade no aparelho: ficar de frente, mostrar ombros/cotovelos/mãos, estender cada braço em direção à câmera, acenar para ambos os lados, esconder uma mão, parar a captura e andar/sentar. Confirmar os gestos em outro computador com compartilhamento ligado. Profundidade e oclusões de uma única câmera são estimativas; testes sintéticos não substituem essa avaliação humana.
