# Teste local de movimentos do avatar

Na casa, abra **Movimentar avatar · teste** e escolha **Ativar câmera só para movimentos**. Enquadre ombros, cotovelos e mãos, fique parado no cenário e experimente acenar/levantar os braços. A prévia é espelhada. **Parar e desligar câmera** retorna suavemente às animações normais. O recurso não guarda preferência de ativação.

Esta primeira versão anima braços, cotovelos e uma pequena inclinação do tronco somente no próprio aparelho. Não transmite vídeo, landmarks ou gestos aos outros visitantes, não usa microfone e não chama Jev/GLM. Pernas continuam com as animações existentes. Caminhar, sentar e carregar objetos têm prioridade. Iniciar conversa/pôquer, ocultar a aba ou sair da página encerra o teste. A câmera do chat tem controle separado.

O runtime MediaPipe já instalado é copiado para o site pelo build. O modelo Pose Landmarker Lite float16 v1 é baixado do Google somente após ativar. A inferência roda em um worker clássico com uma imagem por vez, sem segmentação, com teto de 12 leituras/s. Há redução para 6 leituras/s e margem de descanso proporcional ao tempo de processamento; a frequência real pode ser menor. Leituras acima de 200ms por 12 amostras após aquecimento, travamento de 5s ou três janelas de 2s abaixo de 15fps encerram o teste. Sem suporte a worker/OffscreenCanvas, mantém-se a animação normal, sem fallback bloqueante na interface.

## Desligar/reverter

- Visitante: **Parar e desligar câmera** ou **Fechar**. Tracks, worker, temporizadores e monitor de frames são encerrados. Permissão que chega depois de cancelar também é liberada.
- Produto: configurar `VITE_ENABLE_AVATAR_MOTION=false` e refazer o deploy remove a entrada. Nenhum modelo é carregado sem ativação. O lançamento longo da Layla é independente e pode continuar ativo.
- Não há migração de banco, dependência nova, vídeo gravado ou custo de tokens.

## Verificação

`node --test tests/avatar-motion.test.mjs tests/layla-fetch.test.mjs tests/camera-privacy.test.mjs`

`PLAYWRIGHT_MODULE=/caminho/playwright/index.mjs node tests/avatar-motion-browser.mjs`

O teste de navegador usa câmera artificial para confirmar que o modelo real executa no worker, que parar libera os tracks e que cancelar durante permissão não deixa a câmera aberta. A retargetização usa landmarks sintéticos nos testes unitários. Isso não mede precisão de gestos humanos, aquecimento ou desempenho de um iPhone/Android real; esses pontos exigem o teste opt-in no aparelho.

Referência: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js

## Bolinha

Layla recebe lançamentos de até 5 unidades da casa, antes limitados a 1,8. O código busca a maior distância livre entre 24 direções, reduzindo o alcance perto de móveis/paredes. Verifica o trajeto e a rota da cachorra, evita aterrissar sobre visitantes e conserva a reserva e a devolução da única bolinha.
