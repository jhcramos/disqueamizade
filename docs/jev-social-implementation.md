# Jev: encontros com consentimento

Escopo aprovado: três escolhas (roda, atividade, assunto), a partir de um pedido voluntário aos anfitriões. Não ler mensagens privadas nem inferir orientação/interesses ocultos.

- Uma solicitação dura dez minutos e permite receber uma proposta; pode ser cancelada ou substituída. Explorar sozinho revoga a solicitação.
- Candidatos vêm do estado compartilhado: pessoas disponíveis que pediram companhia, rodas criadas pelos anfitriões com vagas e assentos livres no mesmo ambiente. O bar mantém a mesa de pôquer separada.
- Jev escolhe somente IDs oferecidos pelo servidor, ou nenhuma opção. Três escolhas em lote. Sem chave/erro: regras explícitas e perguntas preparadas.
- Primeiro o solicitante revisa a proposta. Depois o outro visitante/anfitrião da roda aceita. Só então o servidor reserva os assentos; cada visitante escolhe ir até lá. Nenhuma câmera/microfone é ativada.
- Reservas são compartilhadas, verificadas de novo no aceite e na chegada. Conflitos cancelam a entrada e permitem tentar novamente. Não há promessa de conversa iniciada antes do aceite.
- Pedidos são efêmeros e privados. TypeSafe recebe pseudônimos de candidatos e somente seus pedidos autorizados, nunca chats, nomes ou dados de perfil.
- Limites persistidos: uma análise por visitante/minuto e uma global a cada dez segundos; timeout e idempotência. Sem chamadas durante movimento/polling.
- UI: pedido curto no painel de Dora/Téo, proposta privada, consentimento bilateral, botão para ir ao assento, encerrar roda e pedir nova sugestão explicitamente.
- Validar: contrato e falhas do provedor, exemplos reais em português, bloqueios/ocupação/recusa/expiração/concorrência, dois navegadores e mobile, regressões dos moradores/pôquer.

## Validação e limites da primeira versão — 19/09/2026

- Chave TypeSafe validada e cadastrada como variável sensível de produção. Nenhuma credencial em código ou arquivos do projeto.
- Jev `jev-1.13.0`: 8/8 casos sintéticos reais em português, incluindo recusa, interesses incompatíveis, pedido não suportado e instrução para ligar câmera. Aproximadamente 890 tokens de entrada por exemplo; latência observada 280–721 ms. Amostra pequena, não é garantia de acerto geral.
- Testes automatizados cobrem privacidade, aceite bilateral, entrada de terceiro/quarto visitante, lotação, bloqueios, ocupação, rotas nos três ambientes, resposta inválida do provedor, repetição de comandos e CAS. Teste de navegador confirma dois visitantes chegando a assentos diferentes, convite privado e layout mobile.
- Primeiro recorte: encontros no mesmo ambiente, entre visitantes que enviaram pedidos aos moradores; rodas criadas por esse fluxo. Rodas legadas de vídeo e a mesa de pôquer não são convertidas automaticamente.
- Atividades são propostas sociais (música, café, histórias, Biscoito), não execução automática de jogos ou objetos. O visitante continua escolhendo essas interações na casa.
- Encerrar participação reabre Dora para pedir outra sugestão. Não há análise automática contínua nem leitura de mensagens privadas. Dados de pedidos expiram em dez minutos; reservas sem chegada expiram em dois minutos.
- Após sentar, o cartão recolhe para preservar o cenário. A interação por texto/vídeo continua pelos controles existentes, sempre opcional.
