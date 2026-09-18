# Garagem 3D — primeira validação

Rota independente: `/garagem-3d`. A casa atual permanece em `/garagem`.

A cena usa geometria 3D real, texturas procedurais locais, luz e sombras compartilhadas com o avatar. Sofá, poltronas, mesas, quatro telefones, som, plantas, janela e portão compõem uma primeira interpretação da referência. Não é uma reprodução final do acabamento artístico da imagem.

Nesta etapa: caminhar com desvio de móveis, sentar em quatro lugares, levantar, aproximar a câmera, alterar iluminação e tocar/atender um telefone de demonstração. Não há presença compartilhada, vídeo ou ligação real nesta rota. O telefone não solicita câmera nem microfone.

Peças fixas e detalhes de cada móvel interativo são agrupados por material para reduzir chamadas de renderização. A resolução é limitada a 1,5 vezes a resolução CSS; há um único mapa de sombras de 1024 px. A preferência por movimento reduzido é respeitada. Os testes em Chromium com viewport mobile não substituem medição em aparelhos físicos.

Próximos critérios antes de substituir o cenário: aprovação artística, teste em celulares reais, integração de presença/câmeras, movimentação compartilhada e paridade das interações atuais. A qualidade final da referência exige refinamento de modelos, materiais e iluminação.
