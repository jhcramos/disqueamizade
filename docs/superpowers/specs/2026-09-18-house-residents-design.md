# Moradores e objetos da casa

Aprovado na conversa: Dora, Téo e boxer branco Biscoito com rotinas, objetos manipuláveis e participação física dos visitantes. Balões primeiro; voz depois. Preservar a casa, seus caminhos, chamadas e visitantes reais.

## Entrega funcional
Dois avatares originais identificados como moradores virtuais e um boxer branco. Objetos: café/canecas em bandeja, regador, caixa de discos, brinquedo de buscar, caminha e tigela do cachorro. Usar superfícies existentes, sem bloquear passagens. Visitante se aproxima para pegar/devolver objeto, oferecer café, regar planta, entregar disco, jogar brinquedo, acariciar cão e cumprimentar morador. Nunca movimentar outro visitante nem publicar conversa privada.

Rotinas executam caminhos existentes e ações autorizadas, com reservas de objetos, alcance, duração, interrupção e memória limitada de acontecimentos concluídos. Objetos não são duplicados. Moradores não entram na contagem de pessoas, não atendem chamadas reais nem controlam TV/música de visitantes.

## Estado e limites
Camada de simulação independente da renderização. Sincronizar estado entre abas da visita local por coordenador; registrar explicitamente o limite local. Não anunciar sincronização entre dispositivos enquanto não houver serviço autoritativo implantado. Movimentos e rotinas preparados não exigem LLM. Provedor escolhido pelo usuário: DeepInfra, modelo google/gemma-3-27b-it, por uso. Chave e banco correto pendentes de configuração segura; não simular integração com IA generativa nem expor chaves no navegador.

## Interface
Ações contextuais compactas ao tocar morador/objeto, acima da base do cenário, com fechar e status de aproximação. Balões temporários acima da cabeça e um por vez. Opção de esconder falas, acessibilidade de teclado e movimento reduzido. Avatar do visitante só executa ação após chegar e se estado permitir; cancelar durante chamadas/cinema ou ao andar manualmente.

## Verificação
Testes de alcance, exclusão de posse dupla, devolução, cooldown, persistência validada e caminhos; compilação e teste de navegador desktop/mobile. Publicação somente com build válido. Documentar pendências de IA e compartilhamento online com precisão.
