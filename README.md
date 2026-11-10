# Ascensão ao Olimpo

Protótipo web do jogo de tabuleiro descrito na *Especificação consolidada de mecânicas v1.5*,
com o *Sistema de casas v1.6* (efeitos de passagem e de parada) e os *templos v1.8*
(ação principal, ação secundária, investimentos e afinidades de cartas):
2 a 4 jogadores (humanos no mesmo dispositivo e/ou IA) disputam a ascensão divina.
Vence quem primeiro chegar a **20 de Glória**.

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
`PLAY_CARD_MOVE`, `PLAY_CARD_EFFECT`, `BUY_RELIC`, `FREE_POWER`, `END_TURN` e `ANSWER`.
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

## Telemetria (IA × IA, 150 partidas, meta de 20 Glórias, regras v1.8)

| Jogadores | Rodadas (média) | p10–p90 | Duelos/partida | Prisões/jogador | Relíquias/jogador |
|---|---|---|---|---|---|
| 2 | 22,3 | 18–28 | 0,3 | 0,03 | 0,8 |
| 4 | 21,0 | 17–25 | 1,3 | 0,03 | 0,8 |

Qualquer valor de `config.ts` pode ser sobrescrito na simulação com `chave=valor`:

```bash
npm run sim -- 150 4 goal=16
```
