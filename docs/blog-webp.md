# B.4 — Otimização das imagens do blog

Executar `npm run optimize:blog-images` após adicionar PNGs ao diretório
`public/blog-images`. O script usa `sharp` 0.35.4, fixado nas dependências de
desenvolvimento, mantém a proporção e limita a largura a 1200 px sem ampliar
imagens menores; a qualidade WebP é 80.

Antes de remover os originais, todas as saídas são decodificadas integralmente
e validadas. O script atualiza somente URLs locais de imagens com um WebP
correspondente. Uma segunda execução não altera arquivos. PNGs de máscaras,
logos e Open Graph permanecem intactos; o prerender consome as URLs do índice
atualizado e não precisa de substituição global de extensões.

## Resultado verificado

- 104 PNGs ocupavam 91.350.656 bytes (87,12 MiB).
- 103 WebPs ocupam 4.741.826 bytes (4,52 MiB): redução de 94,8%.
- O PNG `chat-online-fortaleza-ceara-nordeste.png` já continha dados comprimidos
  inválidos. Decodificação tolerante produzia faixas pretas e ruído. Suas
  referências agora reutilizam `salas-de-chat-por-cidade-brasil.webp`, uma
  ilustração genérica do Brasil; o original corrompido foi removido.
- Nenhuma referência às 104 imagens removidas ficou apontando para PNG;
  nenhuma nova referência WebP aponta para arquivo ausente.
- Existem **372 caminhos distintos de imagens já ausentes** nos posts e
  scripts anteriores à conversão. Foram preservados para curadoria de conteúdo
  em B.9; esta tarefa não inventa nem substitui em massa suas ilustrações.
- `npm run build` passou e gerou 498 páginas estáticas. A execução repetida do
  otimizador validou as 103 imagens e modificou zero arquivos.
- O `dist/` resultante soma 49.431.456 bytes (47,14 MiB), acima da meta de
  aproximadamente 40 MB. Só os assets existentes de MediaPipe somam 19.431.091
  bytes; otimizar/remover esses assets está fora do escopo das imagens do blog.

Os números de `dist/` correspondem ao build desta tarefa isolada e podem mudar
quando as demais partes da limpeza forem integradas.
