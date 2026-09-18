# Casa 3D — prévia dos três ambientes

Rota independente: `/garagem-3d`. A casa atual permanece em `/garagem`.

A prévia abre na visão da casa inteira: garagem ao fundo, sala à frente à esquerda e bar à direita, numa única cena 3D. Os ambientes compartilham passagens navegáveis. As abas e placas aproximam a câmera sem recriar o cenário ou teleportar o avatar. A garagem tem oito lugares, a sala de estar tem oito, e o bar tem três mesas de quatro lugares e três bancos no balcão. Cada ambiente tem quatro telefones. Não é uma reprodução final do acabamento artístico da imagem.

Nesta etapa: caminhar com desvio de móveis, escolher assentos pelos móveis ou pela lista, sentar, levantar, aproximar a câmera, alterar iluminação e tocar/atender um telefone de demonstração. As placas identificam os móveis e quantos lugares oferecem. Não há presença compartilhada, vídeo ou ligação real nesta rota. O telefone não solicita câmera nem microfone. As contagens são de assentos físicos, não de capacidade de chamada.

O encaixe sentado considera a altura do quadril do modelo já escalado, o topo da almofada e a espessura da coxa; há deslocamento para a frente para os joelhos saírem do assento. Os rodapés ficam à frente das paredes, sem faces coplanares que disputem o buffer de profundidade.

Peças fixas e detalhes de cada móvel interativo são agrupados por material para reduzir chamadas de renderização. A resolução é limitada a 1,5 vezes a resolução CSS; há um único mapa de sombras de 2048 px cobrindo a casa. A preferência por movimento reduzido é respeitada. Os testes em Chromium com viewport mobile não substituem medição em aparelhos físicos.

O mapa global transforma as posições locais dos móveis em coordenadas da casa. A navegação bloqueia paredes, limites externos e o espaço vazio ao lado da garagem; permite atravessar apenas as duas passagens físicas. Os testes verificam trajetos até os 31 assentos, incluindo segmentos entre pontos, e a preservação do canvas/posição ao mudar o enquadramento.

Próximos critérios antes de substituir o cenário: aprovação artística, teste em celulares reais, integração de presença/câmeras, movimentação compartilhada e paridade das interações atuais. A qualidade final da referência exige refinamento de modelos, materiais e iluminação.

## Proximidade e exploração

O botão “Ligar” aparece quando o avatar está a até 1,15 unidade de um telefone do mesmo cômodo. Tocar num aparelho distante planeja um caminho até uma posição livre ao redor da mesinha. O botão “Ir até o telefone” oferece uma alternativa acessível aos alvos pequenos. A ligação continua sendo uma demonstração local, identificada no próprio aviso; nenhum dispositivo de mídia é solicitado.

“Primeira pessoa” usa uma câmera em perspectiva na altura dos olhos, esconde o próprio avatar e restaura os tetos e paredes externas retirados da maquete. Arrastar gira o olhar, W/A/S/D movimentam, as setas laterais giram e os botões na tela funcionam enquanto pressionados. Esc ou “Sair da primeira pessoa” restaura a visão geral sem teletransporte. O botão de recentralizar olha para dentro do cômodo. Movimento é validado em pequenos passos contra os mesmos obstáculos; cancelamento de toque, perda de foco e troca de aba liberam os controles.

Para explorar sozinho: som instrumental gerado localmente (somente após ativação explícita), dança e cartas de perguntas. O som para ao ocultar a página ou sair da rota. Não há reprodução de músicas comerciais ou dependência de serviços externos. Movimento reduzido suprime a animação da dança. As cartas não publicam mensagens no chat.

Verificação adicional: `tests/garage3d-exploration-browser.mjs` cobre a aparição/desaparição do convite por proximidade, demonstração de telefone, teclado, saída da primeira pessoa, controles mantidos/soltos no mobile, arraste, dança, som e cartas. Os testes de layout verificam acesso aos 12 telefones e colisões durante movimento direto.
