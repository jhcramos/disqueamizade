# Prévia privada da câmera

Salas e roleta exigem uma escolha antes de conectar o vídeo. “Ativar prévia privada” abre apenas a captura local; “Confirmar e entrar” autoriza a publicação do canvas processado. “Entrar sem câmera” não publica vídeo nem áudio. O microfone começa desligado.

O seletor começa com Pixelado. A pessoa pode escolher outra máscara ou optar explicitamente por “Sem máscara”. A publicação nunca usa a câmera bruta. Máscaras decorativas e pixelização não garantem anonimato; para ocultar rosto e ambiente, a interface oferece entrar sem câmera.

Se uma máscara estiver carregando, o rastreamento perder o rosto, a detecção ficar desatualizada ou o desenho falhar, o canvas fica coberto. Frames novos não usam uma detecção de um frame anterior. Trocar a máscara durante uma chamada interrompe a transmissão e abre a prévia novamente. Buscar outra pessoa na roleta também volta a essa escolha.

O cancelamento desabilita as faixas imediatamente e remove publicações que terminarem depois dele. Se a pessoa sair enquanto o navegador aguarda permissão, os dispositivos obtidos posteriormente são encerrados.

Validação automatizada: `npm run test:camera`, `npm run test:chat` e `npm run build`. Os testes de câmera usam fontes sintéticas, sem acessar câmera ou microfone reais. A verificação em dispositivos reais deve incluir permissão negada, troca de máscara, saída do rosto do enquadramento, entrada sem câmera e troca de parceiro.
