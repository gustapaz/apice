# Validação

## Regras

16 testes Node Test Runner: estado inicial/opções; movimento por tempo e reprodução em diferentes passos; reflexão e deltas inválidos; interseção/corte e conservação em X; corte em Z preservando X; derrota sem pontuação indevida; precisão, combo e recuperação limitada; quebra de combo; cooldown impedindo ação duplicada; vitória em 12; limite técnico de 100 no infinito; pausa; reinício independente; saves corrompidos; recordes por ritmo; lifecycle blur/visibility e cleanup.

Simulação por passo fixo de 120 Hz com catch-up limitado. A lógica usa coordenadas e interseções reais, sem depender da câmera. A interface é atualizada no máximo aproximadamente 12 vezes por segundo e evita novo estado React quando os valores são iguais.

## Partida em navegador

Build de produção, Chromium integrado: derrota por placa sem apoio, reinício, cortes, precisão/combos, pausa/retomada, ajuda durante partida e vitória real de 12 andares com 2.843 pontos e 10 encaixes perfeitos. Os cliques usaram o botão normal, esperando a janela indicada pelo percentual público; nenhum estado do modelo foi injetado. [Torre no andar 9](local-gameplay.png) e [vitória local](local-victory.png).

Viewport 390 × 844: canvas em 390 × 844 e documento sem overflow horizontal (390 px). Controle com 320 px de largura; botões de ação/pausa de pelo menos 55 px de altura. Ritmo Vivo e modo Infinito selecionados, Space produziu derrota correta; depois dois andares foram assentados pelo botão normal. P pausou, ajuda preservou a rodada e retomada/restauração funcionaram. Recorde Calmo de 2.843 e preferências de áudio/efeitos sobreviveram ao reload. Os recordes não são compartilhados entre ritmos.

Toque físico, gamepad, Safari e auditoria completa de leitor de tela não foram validados. WebGL2 é requisito; o caminho de erro apresenta mensagem e opção de recarregar, sem retry infinito. Eventos de lifecycle são testados com EventTarget; também houve pausa automática durante perda de foco no teste de navegador. O teto de 100 foi coberto por testes de regras, não por uma partida manual completa.

## Build, desempenho e segurança

Build em torno de 776 kB JS (209 kB gzip) e 11 kB CSS. Vite informa um chunk acima de 500 kB: corresponde a React e ao motor 3D do jogo; não são transferidas imagens, fontes ou modelos remotos. Não se alega FPS medido em hardware físico. DPR limitado a 1,5, sombra 1024, geometria de caixa reutilizada, no máximo seis sobras em queda e 101 placas na torre. Cenas paradas deixam de redesenhar quando os efeitos terminam. Cleanup descarta RAF/listeners, geometrias, materiais, shadow target, renderer/contexto e áudio.

`npm audit`: zero vulnerabilidades reportadas, incluindo desenvolvimento, em 01/11/2026. Publicação apenas de build estático e licenças, sem APIs, segredos ou ambiente. Workflow com checkout sem credenciais persistidas e permissões mínimas (leitura no build, Pages/OIDC no deploy). Repositório público e GitHub Pages gratuito, sem cartão/faturamento.
