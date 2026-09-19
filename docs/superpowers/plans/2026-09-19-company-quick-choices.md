# Companhia em dois toques

Design aprovado na conversa: quatro escolhas (papo, música, brincar, qualquer atividade), pedido livre secundário, busca entre ambientes e espera recolhida. Sem cadastro novo ou mudança nos aceites.

- [x] Testar escolhas compatíveis, busca entre cômodos, restrição do bar, espera que reencontra vagas, cancelamento e consentimento.
- [x] Manter escolhas rápidas em código; preservar Jev para pedidos livres. Reavaliar pedidos ativos sem chamadas de IA por polling.
- [x] Mostrar quatro escolhas, remover seletor de personagem do fluxo de anfitriões, compactar espera e oferecer Biscoito como alternativa.
- [x] Informar ambiente de destino; só encaminhar e reservar após os aceites existentes. Manter a reserva durante a troca de ambiente.
- [x] Validar navegador móvel, movimento até assentos, build e segurança; commit, push e publicação.

Bar: usar a confirmação 18+ já existente, transmitida como capacidade da visita. Não oferecer encontros no bar a quem não confirmou; não tratar essa autodeclaração como verificação de identidade.

Validação: testes de regras e API com provedores simulados; navegador desktop para texto livre; navegador móvel com duas visitas em cômodos diferentes, espera recolhida, aceite bilateral e assentos distintos. Build TypeScript/Vite concluído. Nenhuma conversa real foi usada nos testes.
