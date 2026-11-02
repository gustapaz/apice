# Ápice — um andar de cada vez

Jogo de timing e construção espacial, single-player local, React + JavaScript + Three.js/WebGL. Diferente do rebatedor 2D de Ricochete e das conexões por turnos de Vagalume: a decisão é QUANDO assentar uma placa que se move alternadamente em X e Z.

## Regras
Uma placa corre sobre a torre. Clique, toque no botão ou Espaço/Enter para assentar. A área que se sobrepõe ao topo permanece; a sobra cai. Sem sobreposição, derrota. Precisão de até 0,12 unidade encaixa perfeitamente, preserva a área e aumenta combo. Três perfeitos consecutivos devolvem 0,18 unidade em ambos os eixos, até o tamanho inicial de quatro. A câmera acompanha a subida e as sobras têm animação de queda limitada.

Expedição: completar 12 andares encerra com vitória. Infinito: nova partida independente até falhar ou atingir o limite técnico explícito de 100 andares, que encerra como concluída; não há estado nem memória sem limite. Ritmos calmo e vivo têm velocidades diferentes e recordes separados. Sem backend, placar global, contas ou infraestrutura externa. Recordes/preferências locais validados. Não há salvamento da tentativa em andamento.

## Escopo fechado
Menu, instruções reabríveis, escolha de ritmo/modo, partida, feedback de encaixe, indicador legível de sobreposição, combo, restauração parcial por precisão, pausa/retomada, vitória/derrota, reinício e retorno ao menu. Sem loja, monetização, multiplayer ou conteúdo futuro necessário para completar o jogo.

## Visual e som
Céu claro azul-hortênsia, chão quase branco e torre 3D de placas minerais em laranja, ameixa e rosa. Sombras suaves, câmera ortográfica oblíqua, tipografia monumental vazada atrás da torre e HUD mínimo nas bordas. Sem floresta, tabuleiro hexagonal ou arena editorial de arcade. Geometria e áudio Web Audio originais/procedurais. Movimento reduzido suprime sobras animadas e reduz movimentos de câmera/queda, mantendo movimento essencial da placa e oferecendo ritmo calmo. Som opcional inicialmente desligado.

## Interação e acesso
Botão HTML grande para clique/toque; teclado Espaço/Enter restrito ao foco da área de jogo ou ao botão. P/Escape na área pausa; diálogo acessível contém foco e retoma explicitamente. Indicador DOM de sobreposição tem percentual e texto; não deve anunciar cada frame. Mudanças de andar/resultado têm anúncios. Sem promessa de equivalência completa para leitores de tela num jogo temporal/visual. Perda de foco pausa. Viewport móvel será testado; não equivale a hardware físico.

## Aceitação
Modelo testável sem Three/React: interseção em ambos os eixos, cortes, precisão, recuperação, pontuação, falha, vitória em 12, teto de 100, pausa, reset, replay/tempo e save inválido. Movimento por delta limitado, subpasso fixo de 120 Hz. Renderer fora do ciclo React por frame, UI de leitura limitada a 12 Hz; limpeza de RAF, listeners, geometrias, materiais, contextos e áudio. Testar derrota/reinício, vitória pela UI com controles reais, pausa, resize e build público. Scanner staged/histórico/build, dependências auditadas e licenças preservadas. Repo e demo Pages gratuitos, commits noreply de gustapaz, sem cartão/faturamento.
