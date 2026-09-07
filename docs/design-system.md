# Identidade visual

A interface usa grafite, branco quente, verde sálvia e argila. Os títulos editoriais usam Georgia; navegação e controles usam Plus Jakarta Sans com fallback de sistema. Não há nova dependência de fontes ou bibliotecas.

## Arquivos

- `src/styles/site-design.css`: identidade compartilhada, navegação, home, diretório de salas, blog, páginas informativas, conta, roleta e prévia da câmera.
- `src/rooms/room-lounge.css`: área de vídeo, conversa, participantes e controles da sala.
- `tailwind.config.js`: escalas compartilhadas de cores e tipografia.
- `src/components/blog/BlogCover.tsx`: cobertura visual para imagens antigas indisponíveis, tentando a versão WebP antes da composição alternativa.

## Convenções

Use `site-button` ou `btn-primary` para a ação principal e `site-text-link` para navegação secundária. Preserve cores semânticas de erro, alerta e disponibilidade. Estados selecionados precisam de indicação adicional à cor. Mantenha foco de teclado visível e respeite movimento reduzido.

Não crie pessoas ou contadores ilustrativos que possam ser confundidos com presença real. O cartão de sala indica disponibilidade de vídeo, sem estimar quantas câmeras estão ligadas.

A autovisualização pertence à área de vídeo; o quebra-gelo e os controles ficam fora dela. A prévia continua privada e o fluxo não publica câmera nem microfone automaticamente.

## Verificação

Build TypeScript/Vite e 38 testes existentes aprovados. Revisão em navegador nas larguras 1440 e 390 para home, conta, blog, sobre, diretrizes, roleta, filtros e recuperação de senha, sem erros JavaScript. Diretório revisado após verificação de idade. Corrigido transbordamento da paginação do blog no celular. Sala conectada revisada com câmera desligada e acesso à lista de pessoas.

Os testes visuais não substituem um teste de chamada entre dois dispositivos. Nenhuma alteração de transporte de mídia ou permissões do servidor faz parte deste redesign.
