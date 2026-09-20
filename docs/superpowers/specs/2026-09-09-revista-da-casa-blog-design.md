# Revista da Casa — redesign do blog

## Objetivo

Transformar o blog em uma extensão visual e funcional da casa do Disque Amizade. A coleção deve parecer a capa de uma revista editorial acolhedora. Cada artigo deve ser confortável de ler, apresentar imagens relacionadas ao assunto e conduzir naturalmente para a experiência em `/garagem`.

O trabalho cobre a coleção em `/blog`, os artigos em `/blog/:slug`, as capas, os links internos e os CTAs. Não altera o conteúdo editorial dos 491 artigos, o sistema de conta nem a experiência dentro da casa.

## Direção visual

A direção aprovada é **Revista da Casa**:

- fundo creme, texto ameixa, verde escuro e terracota;
- títulos em serifada editorial e textos em fonte simples e legível;
- bordas finas, espaços generosos e detalhes inspirados na arquitetura da home;
- movimento limitado a estados de interação curtos; nenhum conteúdo depende de animação para aparecer;
- logo e navegação iguais às da home, com “Entrar na casa” como ação principal.

## Coleção de artigos

A página começa como a capa de uma edição:

1. cabeçalho da casa;
2. título “Revista da Casa”, descrição curta e busca;
3. uma matéria principal com capa ampla;
4. “Escolhas da casa” com artigos recentes ou destacados — não será usado “Mais lidos” enquanto não houver dado real de leitura;
5. filtros por categoria;
6. grade editorial com 11 matérias adicionais na primeira página e 12 nas seguintes;
7. paginação compacta com anterior, páginas próximas e próxima, evitando dezenas de botões;
8. convite final para conhecer a casa.

Busca e filtros continuam no navegador, com mensagem clara quando não houver resultados. Alterar filtro ou busca volta à primeira página.

## Página do artigo

O artigo usa uma coluna de leitura de aproximadamente 720 px, com:

- breadcrumb, categoria, data e tempo de leitura;
- título, resumo e capa editorial;
- índice recolhível no celular e fixo, mas discreto, em telas grandes;
- texto com hierarquia clara para títulos, listas, citações e links;
- até quatro artigos relacionados;
- compartilhamento e retorno à coleção;
- barra de progresso de leitura sem esconder conteúdo.

O CTA aparece no cabeçalho, após a introdução, aproximadamente no meio e no final. O primeiro e o intermediário são compactos. O final apresenta Garagem, Sala de estar e Bar Vinyl e leva para `/garagem`. A mensagem informa que a câmera começa desligada.

## Sistema de capas

As imagens genéricas atuais deixam de ser exibidas. O sistema terá um conjunto pequeno de cenas editoriais próprias para temas recorrentes, como amizade, conversa, vídeo, segurança, cidades, relacionamento, hobbies, bem-estar, trabalho, maturidade, eventos e plataformas.

Cada artigo é associado a uma cena por categoria e palavras-chave. Sobre a cena, a interface compõe categoria, título curto e um detalhe gráfico da Revista da Casa. Assim, a capa fica ligada ao assunto sem exigir uma imagem exclusiva para cada um dos 491 textos.

Se não houver correspondência, a capa usa a cena geral da casa. Se um arquivo não carregar, a composição textual e a cor continuam visíveis; não aparece imagem quebrada. As mesmas cenas temáticas servem como imagem social nos metadados, sem apontar para os arquivos antigos.

## Links internos

Uma função única seleciona artigos relacionados:

1. mantém `relatedSlugs` existentes somente quando apontam para artigos publicados;
2. completa as vagas pontuando mesma categoria, tags compartilhadas e palavras relevantes do título;
3. remove o artigo atual, duplicatas e destinos inexistentes;
4. limita o resultado a quatro artigos.

Links antigos para `/rooms`, `/room`, `/salas`, `/auth` ou páginas equivalentes do produto são normalizados para `/garagem`. Links entre artigos permanecem somente quando o slug existe no índice. Links externos continuam externos e recebem tratamento seguro.

## Componentes e responsabilidades

- `BlogHeader`: navegação da casa no contexto editorial.
- `EditorialCover`: escolhe a cena e monta a capa a partir do artigo.
- `BlogCard`: apresenta uma matéria na coleção ou em relacionados.
- `HouseCta`: apresenta a entrada da casa nos tamanhos compacto e final.
- `blogTaxonomy`: mapeia categorias e palavras-chave para cenas, cores e rótulos.
- `blogRelations`: valida e classifica os links entre artigos.

As páginas coordenam estado e composição. A lógica de capas, relações e rotas fica fora dos componentes de página para poder ser testada isoladamente.

## Dados e estados de erro

O índice atual em `/blog-posts/index.json` permanece a fonte dos artigos. Enquanto carrega, a página mostra blocos no formato final. Em erro, mostra uma mensagem editorial com ações para tentar novamente e entrar na casa. Um artigo ausente mostra retorno ao blog e à home.

O script de preparação valida antes da publicação:

- todos os slugs e corpos de artigo;
- cenas temáticas referenciadas;
- links internos para artigos existentes;
- ausência de rotas antigas nos CTAs;
- metadados básicos de compartilhamento.

## Acessibilidade, desempenho e responsividade

Texto e controles terão contraste adequado, foco visível e títulos em ordem. Capas decorativas não repetem o título para leitores de tela. Imagens abaixo da dobra usam carregamento tardio e dimensões declaradas. No celular, a coleção vira uma coluna, o índice recolhe e nenhum elemento ultrapassa a largura da tela.

## Verificação

A implementação será verificada em desktop e celular para:

- coleção, busca, filtros e paginação;
- abertura direta e recarregamento de artigos;
- correspondência entre tema e capa;
- links relacionados válidos e sem duplicação;
- todos os CTAs apontando para `/garagem`;
- imagens sociais e fallback de capa;
- ausência de rolagem horizontal ou conteúdo escondido;
- compilação de produção e verificação no domínio publicado.

## Critérios de aceite

- coleção e artigos compartilham a identidade visual da home;
- nenhuma foto genérica antiga aparece nas páginas do blog;
- todo artigo recebe uma capa editorial relacionada ao seu tema;
- links internos só apontam para artigos existentes ou para a casa nova;
- “Entrar na casa” está visível e consistente sem interromper a leitura;
- coleção e artigo funcionam no celular e no computador;
- o blog continua leve e não exige serviço pago de imagens.
