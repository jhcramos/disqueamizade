# Casa 3D — prévia dos três ambientes

Rota independente: `/garagem-3d`. A casa atual permanece em `/garagem`.

A prévia tem três ambientes selecionáveis, com geometria 3D real, texturas procedurais locais, luz e sombras compartilhadas com o avatar. A garagem tem oito lugares, a sala de estar tem oito, e o bar tem três mesas de quatro lugares e três bancos no balcão. Cada ambiente tem quatro telefones. Não é uma reprodução final do acabamento artístico da imagem.

Nesta etapa: caminhar com desvio de móveis, escolher assentos pelos móveis ou pela lista, sentar, levantar, aproximar a câmera, alterar iluminação e tocar/atender um telefone de demonstração. As placas identificam os móveis e quantos lugares oferecem. Não há presença compartilhada, vídeo ou ligação real nesta rota. O telefone não solicita câmera nem microfone. As contagens são de assentos físicos, não de capacidade de chamada.

O encaixe sentado considera a altura do quadril do modelo já escalado, o topo da almofada e a espessura da coxa; há deslocamento para a frente para os joelhos saírem do assento. Os rodapés ficam à frente das paredes, sem faces coplanares que disputem o buffer de profundidade.

Peças fixas e detalhes de cada móvel interativo são agrupados por material para reduzir chamadas de renderização. A resolução é limitada a 1,5 vezes a resolução CSS; há um único mapa de sombras de 1024 px. A preferência por movimento reduzido é respeitada. Os testes em Chromium com viewport mobile não substituem medição em aparelhos físicos.

Próximos critérios antes de substituir o cenário: aprovação artística, teste em celulares reais, integração de presença/câmeras, movimentação compartilhada e paridade das interações atuais. A qualidade final da referência exige refinamento de modelos, materiais e iluminação.
