# Presença e convites privados nas salas

## Objetivo

Mostrar todas as pessoas conectadas à sala, inclusive quem não publicou câmera nem escreveu no chat, e permitir que cada participante controle se aceita convites para mensagem, áudio e vídeo.

## Experiência aprovada

O painel lateral terá as abas **Chat** e **Na sala**. A aba **Na sala** lista a presença real e mostra, em cada pessoa:

- câmera verde quando ela está transmitindo vídeo na sala geral;
- balão, microfone e câmera contornada conforme as modalidades privadas aceitas;
- estado indisponível durante uma conversa privada.

Mensagem privada começa habilitada em cada sessão. Áudio e vídeo começam desabilitados. A pessoa pode mudar as três opções em **Como podem falar comigo hoje?**. O estado é válido apenas para a sala e expira automaticamente.

Pressionar **Chamar** abre somente as modalidades aceitas pelo destinatário. Todo convite exige aceite explícito e expira em 30 segundos. Recusar, expirar ou bloquear não abre nenhum canal privado.

## Privacidade e segurança

- Presença do Supabase informa quem está online e suas preferências de sessão; o LiveKit é a fonte da informação **câmera ligada agora**.
- O navegador nunca afirma que um aparelho possui câmera quando ela está desligada.
- Preferências e convites também são validados no servidor. Um cliente alterado não pode chamar por uma modalidade desabilitada.
- Mensagens diretas exigem convite de mensagem aceito.
- Tokens de salas privadas LiveKit exigem convite de áudio ou vídeo aceito e ainda válido.
- A câmera só é publicada depois da prévia privada já existente. O microfone só é ativado por ação dentro da chamada.
- Ao entrar em áudio ou vídeo privado, a conexão com a sala geral é encerrada. Ao sair, a pessoa retorna à sala geral.
- RLS permite ler um convite somente ao remetente e ao destinatário. Clientes não escrevem diretamente nas tabelas de controle.

## Componentes

- `roomChat.ts`: amplia o payload de Presence e permite atualizá-lo sem reconectar.
- `privateContact.ts`: cliente da Edge Function e assinatura Realtime dos convites autorizados.
- `PeoplePanel.tsx`: lista de presença, ícones, preferências e ações de convite.
- `PrivateInvitePrompt.tsx`: aceite, recusa e contagem de expiração.
- `PrivateCall.tsx`: conversa de áudio/vídeo em sala LiveKit por par.
- `private-contact` Edge Function: salva preferências, cria convites, responde e encerra chamadas.
- Migração: preferências efêmeras e convites privados com RLS, índices, expiração e publicação Realtime.

## Estados e falhas

Falha ao atualizar preferências restaura o estado anterior e mostra erro. Convite duplicado reutiliza o pendente existente. Convite expirado, pessoa offline ou modalidade desabilitada retorna uma mensagem clara. Reconexões recuperam convites pendentes ou aceitos ainda válidos. Bloqueios locais escondem a pessoa e impedem ações pela interface; o servidor rejeita convites a contas bloqueadas quando houver bloqueio persistente disponível.

## Fora do escopo

Não haverá chamada fora da sala atual, histórico de ligações, caixa postal, chamadas em grupo ou gravação.

## Critério de pronto

Dois usuários autenticados na mesma sala se veem na aba **Na sala** sem ligar câmera ou enviar mensagem. Preferências atualizam os ícones. Convites podem ser aceitos, recusados e expiram. Mensagem abre o DM existente; áudio e vídeo abrem uma sala privada autorizada. Testes comprovam validação, RLS, presença, UI e bloqueio de token privado sem convite.
