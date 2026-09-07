# Home da casa e identidade social — revisão de lançamento

Implementado: home em tons creme/terracota com imagens dos três cenários e retratos exportados do renderizador Bloco Pop; CTA sem cadastro; perfil opcional em modal sem desmontar a sala; autenticação por link de email; apelido, @ único, bio, cinco interesses e preferência de pedidos; avatar privado salvo/restaurado na conta; busca exata por @; pedidos com aceite, recusa, cancelamento, remoção, bloqueio e desbloqueio. Não há cobrança ou loja nesta entrega.

`/minha-conta` abre o painel independente. Na garagem, “Perfil e amigos” abre o mesmo fluxo mantendo o personagem. A aparência da sessão é enviada apenas ao clicar em salvar; restaurar a aparência da conta é uma ação explícita. Vincular email à sessão anônima usa `updateUser` e exige confirmação pelo Supabase. Não se declara cadastro concluído só porque o link foi enviado.

## Verificação

- Build TypeScript/Vite e prerender.
- `tests/garage-social-db.mjs`: executa a migração em PostgreSQL via PGlite e testa RLS com papéis reais (guest, dono, outra conta, destinatário); sem banco de produção.
- `tests/garage-social-browser.mjs`: interface com transporte REST simulado; salva, pede, aceita, cancela, bloqueia, desbloqueia e apresenta falhas sem falso sucesso.
- Home e modal inspecionados em desktop e celular.
- Regressões de chat local e quatro vídeos sintéticos.

## Antes de promover como serviço online

1. Conectar o projeto Supabase do Disque Amizade. A conexão MCP desta sessão lista somente “Urbix Agents”; esse banco não foi alterado.
2. Aplicar `supabase/migrations/20260907103957_garage_social_identity.sql` no projeto correto, executar os advisors e repetir os testes com contas de teste autorizadas em dois navegadores/dispositivos.
3. Verificar envio de email, vinculação manual de identidade anônima e allowlist de redirecionamento para `/minha-conta` nos domínios de prévia e produção. Confirmar que o avatar pode ser recuperado em outro dispositivo.
4. A garagem continua uma prévia: chat geral e vídeo de quatro pessoas usam transporte local. A integração online da garagem não tem paridade (nem capacete online validado), e não deve ser anunciada como pronta. A nova home informa isso e mantém acesso às salas online tradicionais.
5. Validar consentimento, bloqueio/denúncia e verificação etária do ambiente adulto para o serviço online; o checkbox atual é apenas autodeclaração.

A home pode ser revisada em deployment de prévia, mas a promoção de todo o novo serviço requer as validações acima. Nada foi migrado no banco errado nem foram criadas cobranças.

Também foi removida da rota legada `api/update-profile.ts` a aceitação de campos de VIP, saldo e ganhos vindos do navegador; eram incompatíveis com o isolamento de perfil e os futuros itens pagos.
