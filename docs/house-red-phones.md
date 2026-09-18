# Telefones vermelhos

Quatro aparelhos por ambiente: garagem, sala de estar e bar. `/roulette` agora abre os telefones da casa; a máquina grande saiu do cenário.

Toque no aparelho ou use **Interagir → Disque Surpresa**. Ligar sorteia um aparelho livre num ambiente com alguém disponível. O destino pulsa e toca após o navegador liberar áudio por interação; há controles para silenciar e parar de receber chamadas. Uma faixa permite atender fora do enquadramento mobile. Primeiro atendimento confirmado ganha. Câmera e microfone começam desligados, com a prévia privada existente da roleta. Sem resposta, expira em 35 segundos; sessões desconectadas deixam de estar disponíveis em até 20 segundos. O bar respeita a confirmação de maioridade existente, que não equivale a verificação documental.

`house_phone_desk` é a única API das tabelas privadas. A identidade vem do JWT. A função escolhe destinos, respeita bloqueios registrados, reserva atomicamente e cria um `private_invites` aceito para autorizar o par no gateway LiveKit. Heartbeat a cada quatro segundos. Uma aba ativa por conta; para testar duas pessoas, usar navegadores/perfis independentes.

Os telefones funcionam online mesmo com exploração local. Isso não transforma a presença dos avatares ou o chat público local em sincronização global. Não houve teste de carga para mil visitantes; medir consultas antes de ampliar tráfego. Não há tarefa automática de retenção de chamadas encerradas nesta entrega.

## Verificação

- `tests/house-phones.sql`: fixtures temporárias, transação revertida; roteamento, aceite único, autorização de mídia e desligamento.
- `tests/house-phones-online.mjs`: três autenticações anônimas reais, dois atendimentos concorrentes, token LiveKit para ambos, encerramento e acesso direto às tabelas negado. Sem solicitar mídia. IDs das fixtures em `/tmp/disque-phone-test-users.json` para exclusão após o teste.
- `tests/garage-roulette-entry-browser.mjs`: quatro aparelhos em cada ambiente, modal mobile/desktop, Escape, som, atalho, redirecionamento e zero pedidos de mídia.
- Regressões de exploração mobile e grupos. Build completo validado na Vercel: o build local ficou limitado pelo disco cheio.
