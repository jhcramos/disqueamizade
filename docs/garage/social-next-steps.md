# Depois do chat: identidade, amizades e receita

Proposta para discussão; não implementa contas ou cobranças.

1. **Guardar o personagem.** O editor já salva o avatar neste navegador. Explicar isso na interface e oferecer “Guardar meu avatar numa conta” depois que a pessoa personalizar ou terminar uma boa conversa. A visita continua sem cadastro obrigatório.
2. **Conta opcional.** Vincular a visita à conta sem perder aparência e nome; guardar o avatar no servidor com acesso restrito ao dono, permitir edição e exclusão. Antes de alterar o fluxo, revisar a autenticação que já existe no produto.
3. **Amizades consentidas.** Pedidos de amizade, aceitar/recusar, bloquear e denunciar. Presença e convites controlados pela pessoa; mensagens privadas apenas após consentimento. Não publicar email, localização ou histórico de salas por padrão.
4. **Chat online.** Antes de abrir o protótipo ao público: validar remetente e participação no ambiente no servidor, limitar frequência, oferecer bloqueio/denúncia, definir retenção e moderação. O chat desta entrega usa BroadcastChannel, apenas entre abas do mesmo navegador/origem; guarda até 100 mensagens em memória e limpa ao trocar de ambiente ou sair. Não é um serviço online de mensagens.
5. **Receita para experimentar.** Primeira hipótese: vender roupas, cabelos, acessórios e coleções autorais com prévia no próprio personagem. Segunda hipótese: assinatura com mais combinações salvas e personalização de ambientes. Conversar, usar proteção de rosto, bloquear e denunciar continuam recursos básicos. Validar interesse antes de definir preço ou implementar pagamentos.

Sequência proposta: avatar salvo em conta → amizades e controles de privacidade → chat online moderado → loja cosmética piloto. Itens comprados devem ser atribuídos pelo servidor após confirmação do pagamento, nunca pelo navegador.
