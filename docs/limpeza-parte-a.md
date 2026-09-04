# Limpeza do projeto antigo — Parte A

## Alterações

- Removidas as seis páginas órfãs de A.1 e as sete páginas/rotas antigas de A.2.
- Removidos links antigos do Header, Footer, Home e MobileNav. O menu móvel agora oferece Roleta e Blog nos lugares dos serviços removidos.
- Home sem marketplace, promoção/saldo de fichas, hobbies mock ou contadores de creators/lives antigas.
- Removidas as sete pastas de componentes de A.3, os seis arquivos `mock*`, os stores de fichas/camarote, configuração de planos, serviço Stripe e os dois componentes de camarote sem consumidores.
- Retirado o camarote minimizado global do App.
- Mantido ProtectedRoute para perfil; removidas somente opções de assinatura/premium sem consumidores e seus redirecionamentos para `/pricing`.
- Removidos hooks órfãos de pacotes de fichas/creators e consulta de creators nas estatísticas da Home.
- As dependências listadas em A.5 já não constavam do manifest/lockfile de origem; nenhuma alteração de dependências foi necessária.

## Verificação

Quatro builds completos passaram após os grupos de remoção, incluindo TypeScript, Vite e prerender. Cada execução reportou 498 páginas estáticas geradas pelo script (blog + salas). Isso não significa que haja apenas 498 arquivos HTML em dist, que também recebe outros arquivos públicos.

`git diff --check` passou. Inspeção estática confirmou que os destinos do Header, Footer e MobileNav correspondem às rotas mantidas. Nenhum link ou chamada navigate para marketplace, creator, pricing, hobbies, camarote ou design permanece em src. Verificação no navegador local: links do Header (Salas, Roleta 1:1, Blog, Sobre) e todos os 13 links do Footer abriram as rotas esperadas, sem tela 404. Salas exibiu a verificação de idade existente, sem avançar por ela; câmera, chamadas e acesso ao banco remoto não foram validados. O link de autenticação foi verificado pelo Footer; depois de visitar Roleta o Header passou ao estado de convidado, conforme comportamento existente.

## Exceções necessárias ao critério A.6

A lista MANTER proíbe alterar a função das telas atuais e da infraestrutura Supabase. Por isso a busca textual ampla de A.6 ainda encontra:

- ProfilePage: saldo de fichas, identificação e ativação de creator;
- AdminPage: custo de sala e métrica de receita em fichas;
- authStore, tipos e serviços Supabase: campos e operações compatíveis com o schema existente;
- RoomsPage: mapeamento do custo de sala;
- LegalPage: termos e políticas antigos sobre pagamentos/creators;
- AboutPage: texto histórico do produto;
- classes CSS, tema e imagem de fundo chamados `balada` (aparência preservada).

Remover esses recursos exige conciliar explicitamente o objetivo A.6 com a preservação funcional de MANTER e revisar o contrato do banco. Não foram alterados silenciosamente.

A simulação de presença permaneceu intacta, pois sua remoção pertence à Parte B.1. Moderação e a política de futuras salas adultas pertencem à Parte B.
