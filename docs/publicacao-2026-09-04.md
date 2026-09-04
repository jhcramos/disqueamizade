# Publicação de 04/09/2026

Destino: https://disqueamizade.com.br. Publicação Vercel pronta/promovida:
https://disqueamizade-gg9w3esyi-jhcramos-projects.vercel.app
(id dpl_EgxB8na2r9owtsgjLGGg8H1F7etm). Código publicado: 4a87c75.

Inclui limpeza Parte A, remoção da simulação, WebP e chat autenticado/moderado.
Clarity permanece adiado; detector de nudez não foi ativado e salas adultas não
foram criadas. Os itens condicionais restantes constam em parte-b-status.md.

Supabase DisqueAmizade:
- 20260904063330 guard_privileged_profile_fields;
- 20260904063337 moderated_chat;
- 20260904063344 remove_activity_simulation;
- Anonymous Sign-Ins habilitado;
- send-chat v1 e livekit-token v2, ambas com auth.getUser antes da autorização.

Verificações: build remoto com 498 páginas; 13 testes locais; RLS/privilégios e
concorrência em banco isolado. Teste remoto de duas sessões anônimas e uma conta
confirmou Realtime, filtro, leitura privada, negação de escrita/RPC direto e
limite concorrente. Outro convidado testou emissão de vídeo e negação de
identidade adulterada/sala inexistente. Quatro usuários sintéticos removidos.
Nenhuma câmera/microfone foi acessada e nenhum usuário real recebeu teste.

O histórico foi sanitizado e as branches main e
claude/disque-amizade-site-analysis-1f88kk foram reescritas com leases exatos após
autorização. 439 commits e a árvore final foram examinados: apenas chave pública
anon histórica e dois exemplos incompletos de documentação foram classificados
como falsos positivos; nenhum novo segredo encontrado. A chave Google exposta
foi revogada pelo proprietário. Referências antigas de PR/cache do GitHub podem
requerer remoção pelo suporte; a reescrita não comprova remoção desses caches.

Após a reescrita, clones antigos devem ser substituídos ou realinhados antes de
novos pushes para não restaurar o histórico com a chave revogada.
