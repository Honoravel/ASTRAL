# Ascensão ao Olimpo

Protótipo web do jogo de tabuleiro descrito na *Especificação consolidada de mecânicas v1.5*,
com o *Sistema de casas v1.6* (efeitos de passagem e de parada) e os *templos v1.8*
(ação principal, ação secundária, investimentos e afinidades de cartas) e as *mecânicas
estratégicas v1.9* (armadilhas, sabotagem, política, eventos globais e contratos):
2 a 4 jogadores (humanos no mesmo dispositivo e/ou IA) disputam a ascensão divina.
Vence quem primeiro chegar a **30 de Glória**.

## Como rodar

```bash
npm install
```

```bash
npm run dev
```

Outros comandos:

- `npm test`: testes do motor (critérios de aceite da seção 15).
- `npm run build`: gera `dist/index.html`, um único arquivo autocontido (o mesmo publicado como artefato).
- `npm run sim -- 200 4`: simula 200 partidas de IA com 4 jogadores e imprime a telemetria.

## Estrutura

- `src/engine/`: regras em TypeScript puro, sem dependência de navegador. É a parte a portar para Godot.
  - `config.ts`: todos os valores ajustáveis (recursos iniciais, casas, tabelas de dados).
  - `board.ts`: 96 casas com `onPass`/`onStop`, bifurcações e validação da tabela de tipos.
  - `cards.ts`: 56 Arcanos Menores e seus efeitos. `destiny.ts`: 22 Arcanos Maiores.
  - `data.ts`: deuses, ações de templo, relíquias e signos.
  - `game.ts`: fila de efeitos, comandos (`apply`), Tártaro, Oráculo, relíquias, duelos, salvar/carregar.
  - `ai.ts`: IA que simula cada jogada possível numa cópia do estado.
- `src/ui/`: interface web (SVG + DOM).

Humanos e IA usam a mesma API: `apply(state, command)`. Os comandos são
`PLAY_CARD_MOVE`, `PLAY_CARD_EFFECT`, `PLACE_TRAP`, `BUY_RELIC`, `FREE_POWER`, `SABOTAGE`,
`ABANDON_CONTRACT`, `END_TURN` e `ANSWER`.
`ANSWER` responde à decisão pendente em `state.pending` (rota de teletransporte, alvo, descarte,
saída do Tártaro, substituição de relíquia, lance de duelo). A rota do movimento é escolhida pelo
destino: como cada bifurcação leva a casas distintas, o destino define o caminho.

## Movimento (v1.6)

Uma carta de movimento percorre exatamente o seu valor. Cada casa intermediária aplica o efeito de
**passagem**, na ordem do caminho, e a última aplica só o efeito de **parada**. A casa inicial não é
ativada e teletransportes não ativam nada. O resultado fica em `state.lastMove`
(`path`, `passedNodes`, `destination`, `events`).

| Casa | Qtde. | Passagem | Parada |
|---|---|---|---|
| Comum | 12 | — | — |
| Dracmas | 10 | +1 Dracma | +2 Dracmas |
| Pedágio divino | 8 | −1 Dracma | −2 Dracmas |
| Tesouro | 4 | — | +2 a 5 Dracmas |
| Favor | 8 | — | +2 Favores |
| Altar | 6 | — | Aposta 1–3 Dracmas, 1d6 +1 por Dracma além do primeiro: 1–2 nada · 3–4 +1 Favor · 5+ +2 Favores |
| Glória | 6 | +1 Glória | +2 Glórias |
| Provação | 6 | — | 1d6 de risco |
| Evento | 6 | — | 1d6 de evento menor |
| Destino | 6 | — | Revela Arcano Maior |
| Nêmesis | 4 | Com Húbris ≥ 4: −1 Dracma | Julgamento |
| Bifurcação | 6 | Escolha de rota | — |
| Templo | 12 | — | Ação divina, relíquia ou nada |
| Delfos | 1 | — | Consultar o Destino |
| Tártaro | 1 | — | Entrada comum, sem prisão |

Pedágio (ou fiscalização de Nêmesis) sem saldo: paga o que tiver e ganha 1 Húbris, uma vez por casa.

## Mapa sem fim: atalhos e retornos

A espiral tem 26 casas por volta. Além das seis bifurcações da v1.5 (atalhos para a volta de
dentro), seis **retornos** levam à volta de fora, no mesmo ângulo:

| Origem | 28 | 39 | 60 | 71 | 84 | 92 |
|---|---|---|---|---|---|---|
| Retorno | 02 | 13 | 34 | 45 | 58 | 66 |

Cada retorno fecha um anel de 27 passos, então o jogador pode dar voltas e revisitar templos e
casas sem ir até o centro. As casas de origem mantêm o tipo e os efeitos e só ganham uma segunda
saída (ficam em `RETURNS`, em `board.ts`). Isso altera a topologia da v1.5/v1.6 a pedido do autor.

## Templos (v1.8)

Ao **chegar** a um templo por movimento, o jogador escolhe uma opção: ação principal, ação
secundária, comprar a relíquia, jogar o efeito de uma carta permitida ali, ou nada.

| Templo | Ação principal | Ação secundária |
|---|---|---|
| Zeus | Ascensão: 6 Dracmas → +2 Glórias, +1 Húbris (1 vez a cada 3 rodadas) | Decreto Olímpico: 3 Favores → +1 Glória |
| Hera | Influência: 2 Favores → 4 Dracmas, ou 5 Dracmas → 2 Favores | Proteção Real: 2 Favores → escudo |
| Apolo | Visão Profética: 2 Dracmas → reorganizar 3 cartas do Destino | Purificação: 3 Dracmas → −2 Húbris |
| Ártemis | Caçada: 1d6, +1 a 5 Dracmas (1: +1 Húbris) | Caça Sagrada: 2 Dracmas → comprar 2, descartar 2 |
| Atena | Julgamento: 3 Dracmas → disputar 2 Favores (falha: +1 Húbris) | Estratégia: 2 Favores → reorganizar 3 do Destino |
| Ares | Confronto: 2 Dracmas e 1 Favor → duelo à distância por 1 Glória | Preparação de Guerra: 2 Dracmas → +2 no próximo duelo |
| Hefesto | Forja: 5 Dracmas → +1 por rodada até render 8 | Aprimoramento: 3 Dracmas → próxima carta divina −1 |
| Dionísio | Êxtase: +5 Dracmas, +2 Húbris, mão nova | Cassino Divino: aposta 1–3 Dracmas |
| Hermes | Comércio: 1 Glória → 5 Dracmas, ou 3 Dracmas → 1 Favor | Contrabando: 2 Dracmas → trocar até 3 cartas |
| Deméter | Colheita: 4 Dracmas → +2 por rodada por 4 rodadas | Oferta da Terra: 3 Dracmas → +2 Favores |
| Afrodite | Persuasão: 3 Dracmas → +2 Favores | Encantamento: 2 Favores → 3 Dracmas de um adversário |
| Poseidon | Tesouro Submerso: 1d6, +2 a 7 Dracmas (1: +1 Húbris) | Travessia: 3 Dracmas → casa comum da região seguinte |

## Mecânicas estratégicas (v1.9)

| Sistema | Estado | Como funciona no protótipo |
|---|---|---|
| Cartas de múltiplos usos | Ligado | Ao selecionar a carta: rotas de movimento, efeito com custo e motivo de indisponibilidade |
| Armadilhas | Ligado (`modTraps`) | Ação principal: descarta uma carta, paga o custo e escolhe a casa. Ocultas, 2 por jogador, 3 rodadas |
| Sabotagem por cartas | Ligado | 3 e 5 de Paus, 8 de Paus, Cavaleiro de Paus, Cavaleiro de Copas e 5 de Espadas seguem os limites |
| Sabotagem direta | Desligado (`modSabotage`) | Comando `SABOTAGE` com os cinco tipos e custos da tabela, aguardando aprovação |
| Política | Ligado | Campanha (Hera), Intriga (Atena), Decreto de Proteção (Zeus), teto de 10 Favores, histórico de eleições |
| Investimentos | Ligado | Forja e Colheita pagam ao fim da rodada, inclusive no Tártaro; painel mostra renda, prazo e total |
| Manipulação da mão | Ligado | Ações de Hermes, Ártemis, Apolo e Delfos; a mão volta a 6 ao fim da ação |
| Eventos globais | Ligado (`modEvents`) | Um evento sorteado após cada eleição, válido por 6 rodadas |
| Contratos divinos | Desligado (`modContracts`) | 12 contratos, aceitos na chegada ao templo; abandonar custa 2 Dracmas |

Os módulos são ligados e desligados em `config.ts` (1 ou 0) e podem ser testados na simulação:

```bash
npm run sim -- 150 4 modContracts=1
```

Correspondência com os comandos da seção 11: `PLACE_TRAP`, `ABANDON_CONTRACT` e `SABOTAGE` são
comandos; `START_INVESTMENT`, `PERFORM_POLITICAL_ACTION`, `MANIPULATE_HAND` e `ACCEPT_CONTRACT`
são opções da decisão de chegada ao templo (respondidas com `ANSWER`); `RESOLVE_TRAP`,
`PROCESS_INVESTMENT_INCOME`, `PROCESS_CONTRACT_PROGRESS`, `ACTIVATE_GLOBAL_EVENT` e
`EXPIRE_GLOBAL_EVENT` são passos automáticos do motor (movimento e fim de rodada).

### Conflitos com versões anteriores e como foram resolvidos

- **Topologia**: a v1.9 pede para não alterar o mapa, mas os seis retornos foram pedidos depois da
  v1.8 e continuam. Nenhuma casa foi criada.
- **Economia v1.7**: esse documento não foi recebido. Da v1.9 foi aplicado o teto de 4 Dracmas de
  passagem por movimento.
- **Armadilhas**: não existem "cartas de armadilha" e a v1.9 proíbe criar cartas. Qualquer carta
  da mão pode ser descartada para armar uma armadilha. Uma nova armadilha na mesma casa substitui
  a anterior, sem revelar se havia outra.
- **Sabotagem não tira Glória**: o 8 de Paus (v1.5) tira 1 Glória. Mantido, pois a v1.5 prevalece.
- **Não ver cartas ocultas**: o 4 de Espadas (v1.5) mostra a mão de um adversário. Mantido.
- **Decreto de Zeus**: a v1.8 já tinha o Decreto Olímpico (3 Favores → 1 Glória). O da v1.9
  entrou como uma terceira opção, "Decreto de Proteção".
- **Campanha de Hera** (3 Dracmas → 1 Favor) é pior que a Influência da v1.8 (5 Dracmas → 2 Favores).
- **Motor imutável**: o motor altera o estado recebido; para simular, a IA trabalha numa cópia.
- **Eventos globais**: o primeiro só aparece após a primeira eleição (rodada 6).
- **Conselho de Atena**: vale por jogador, na primeira carta de Espadas da rodada.

## Rebalanceamento econômico

Dinheiro mais importante, Glória mais cara e mais risco nas ações poderosas.

| Parâmetro | Antes | Agora |
|---|---|---|
| Glória para vencer | 20 | 30 |
| Dracmas / Favor iniciais | 5 / 1 | 10 / 2 |
| Teto de Favor | 10 | 12 |
| Teto de Dracmas de passagem | 4 | 6 |
| Suborno no Tártaro | 4 | 8 |
| Multa de Nêmesis | 4 | 6 + Húbris |
| Casas de Dracmas (passagem / parada) | +1 / +2 | +3 / +6 |
| Pedágio (passagem / parada) | −1 / −2 | −2 / −4 |
| Casas de Glória (passagem / parada) | +1 / +2 | 0 / +2 |
| Relíquias | 5 a 8 | 10 a 18 |
| Ascensão de Zeus | 6 Dracmas | 10 Dracmas |
| Forja / Colheita | 5 → 8 / 4 → 8 | 10 → 16 / 8 → 16 |

Movimento por carta: Ás 1 · 2 a 6 pelo valor · 7, 8 e 9 andam 3 · 10 anda 4 · Pajem 2 · Cavaleiro 5 ·
Rainha 3 · Rei 4. São 20 cartas de 3 passos, 12 de 4, 8 de 2, 8 de 5, 4 de 1 e 4 de 6.

Catálogo das 56 cartas: custos e efeitos seguem a tabela "original → proposto" do autor, e estão
listados em `docs/REFERENCIA.md` (seção 13). Pontos de integração:

- **Movimento**: mantido como está no motor (a distribuição concentrada em 3 passos), não a coluna
  "Mov. na referência" do catálogo, que era da versão anterior.
- **Rota normal**: o Cavaleiro de Copas (3 casas) e o Cavaleiro de Ouros (2 casas) seguem sempre a
  saída principal, sem atalhos nem retornos, e sem escolha de destino.
- **4 de Espadas** passou a contar como sabotagem (interferência).
- **Pajem de Espadas**: −3 na próxima carta de efeito. Não acumula com Martelo nem Aprimoramento.
- **Sem permanentes** nas cartas: a função fica nas relíquias e nos investimentos.

Extrapolações (não estavam nos pedidos; feitas para manter a mesma escala):

- **Custos de templo** subiram para a faixa de 3 a 5 Dracmas (8 a 10 nas ações fortes); ganhos de
  templo, tesouros, duelos, armadilhas e eventos subiram na mesma proporção.
- **Eleição**: após a votação, cada jogador perde metade do Favor, arredondada para baixo.
- **Descontos**: Aprimoramento vale −3 e o Martelo −2, pois −1 deixou de pesar em cartas de 11 a 18.

Todos os números estão em `src/engine/config.ts` e a tabela completa em `docs/REFERENCIA.md`.

## Regras presumidas (não especificadas na v1.5)

Decididas com o autor:

- Cada signo tem um deus patrono do seu elemento e o jogador começa no templo dele.
- O jogador escolhe alvos e opções; a IA decide por heurística.

Presumidas na implementação, a confirmar:

- Tabela signo–patrono: Áries–Ares, Touro–Hera, Gêmeos–Hermes, Câncer–Afrodite, Leão–Zeus,
  Virgem–Deméter, Libra–Atena, Escorpião–Dionísio, Sagitário–Hefesto, Capricórnio–Ártemis,
  Aquário–Apolo, Peixes–Poseidon. O patrono só define a casa inicial.
- Afinidades de cartas (v1.8): tratadas como **permissão extra**. A carta listada num templo também
  pode ter o efeito usado ali, sem perder os templos da v1.5. Não restringem nada.
- Na chegada ao templo, as cartas oferecidas são as elementais/divinas válidas ali e as afins.
- Caçada: o ganho é o valor do dado, limitado a 5. Tesouro Submerso: dado + 1.
- Julgamento de Atena: cada lado rola 1d6; quem age vence só se tirar mais.
- Confronto de Ares: o atacante vencedor toma 1 Glória do defensor (escudo e Égide protegem);
  o defensor vencedor recebe 1 Favor, como no duelo comum.
- Cassino Divino: com 4, 5 ou 6 o jogador recebe o dobro da aposta; com 1 a 3, perde-a.
- Forja rende 8 Dracmas no total (1 por rodada). Colheita rende 2 por rodada por 4 rodadas.
- Contrabando: descarta até 3 cartas e compra a mesma quantidade.
- Vender Glória em Hermes não é bloqueado por escudo.
- O limite de três rodadas vale só para a Ascensão de Zeus, a única ação principal que dá Glória.
- Modelo econômico: **equilibrado** (a opção recomendada na v1.6), ainda não confirmado.
- Altar: o jogador pode desistir de apostar. Cada Dracma além do primeiro soma 1 ao dado
  (a regra original não diferenciava as apostas).
- Ação de templo: só ao **chegar** ao templo por movimento. Não existe mais como ação principal de
  quem já está parado no templo, o que impedia "acampar" (por exemplo, 2 Glórias por rodada em Dionísio).
  Comprar a relíquia continua possível como ação principal.
- Ira de Nêmesis: quem encerra o turno com 6 ou mais de Húbris é condenado ao Tártaro e a Húbris cai para 4.
- Casas de Glória: +1 na passagem e +2 na parada (eram 0 e +1), para acelerar a partida.
- Fiscalização de Nêmesis sem saldo dá 1 Húbris, como o pedágio.
- Arco de Ártemis ignora só efeitos negativos de **parada** (pedágio, Provação, Evento, julgamento).
- Tridente de Poseidon rende a cada região nova atravessada no caminho (máximo 2 por rodada).
- A rota é escolhida pelo destino: cada destino tem um único caminho possível neste mapa.
- Empates de "líder" e "menos Glória": vale o primeiro na ordem do turno a partir do jogador ativo.
  O mesmo vale para a vitória quando dois passam da meta juntos.
- Baralho vazio: o descarte é reembaralhado. Mão vazia: o jogador pode encerrar o turno sem agir
  (isso é permitido a qualquer momento).
- Oráculo: ganha +1 Glória a cada eleição vencida, inclusive reeleição. A Proteção do Destino é
  oferecida quando um Arcano Maior prejudicaria o Oráculo.
- Descontos: o do signo soma com um único desconto de carta/relíquia (Pajem de Espadas ou Martelo).
- Relíquias passivas valem assim que compradas e continuam valendo na prisão; as manuais não.
  Égide e Arco agem sozinhos na primeira ocasião da rodada.
- Foice rende no início de cada rodada a partir da segunda; Cinto rende ao fim das rodadas 3, 6, 9…
- "Teletransportar até N casas adiante" permite ficar onde está.

## Telemetria (IA × IA, 150 partidas, meta de 30 Glórias, catálogo rebalanceado)

| Jogadores | Rodadas (média) | p10–p90 | Duelos/partida | Prisões/jogador | Relíquias/jogador | Cartas por efeito | Templos/jogador |
|---|---|---|---|---|---|---|---|
| 2 | 35,5 | 30–42 | 0,7 | 0,19 | 0,7 | 19% | 7,7 |
| 4 | 35,3 | 30–41 | 3,4 | 0,21 | 0,6 | 20% | 7,4 |

Os jogadores terminam com cerca de 7 Dracmas cada: não há acúmulo de dinheiro.

## Referência

Todas as correspondências (valores, cartas, casas, efeitos, deuses e signos) estão em
[`docs/REFERENCIA.md`](docs/REFERENCIA.md), gerado a partir do motor:

```bash
npm run reference
```
