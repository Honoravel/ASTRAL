# Ascensão ao Olimpo

Protótipo web do jogo de tabuleiro descrito na *Especificação consolidada de mecânicas v1.5*:
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
  - `board.ts`: 96 casas, bifurcações e validação da tabela de tipos.
  - `cards.ts`: 56 Arcanos Menores e seus efeitos. `destiny.ts`: 22 Arcanos Maiores.
  - `data.ts`: deuses, ações de templo, relíquias e signos.
  - `game.ts`: fila de efeitos, comandos (`apply`), Tártaro, Oráculo, relíquias, duelos, salvar/carregar.
  - `ai.ts`: IA que simula cada jogada possível numa cópia do estado.
- `src/ui/`: interface web (SVG + DOM).

Humanos e IA usam a mesma API: `apply(state, command)`. Os comandos são
`PLAY_CARD_MOVE`, `PLAY_CARD_EFFECT`, `TEMPLE_ACTION`, `BUY_RELIC`, `FREE_POWER`, `END_TURN` e `ANSWER`.
`ANSWER` responde à decisão pendente em `state.pending` (rota de teletransporte, alvo, descarte,
saída do Tártaro, substituição de relíquia, lance de duelo). A rota do movimento é escolhida pelo
destino: como cada bifurcação leva a casas distintas, o destino define o caminho.

## Regras presumidas (não especificadas na v1.5)

Decididas com o autor:

- Casas: Comum sem efeito; Dracmas +2; Favor +1; Glória +1; Evento rola 1d6
  (1 −2 Dracmas · 2 +1 Húbris · 3 +2 Dracmas · 4 compra 1 carta · 5 +1 Favor · 6 +1 Glória).
- Cada signo tem um deus patrono do seu elemento e o jogador começa no templo dele.
- O jogador escolhe alvos e opções; a IA decide por heurística.

Presumidas na implementação, a confirmar:

- Tabela signo–patrono: Áries–Ares, Touro–Hera, Gêmeos–Hermes, Câncer–Afrodite, Leão–Zeus,
  Virgem–Deméter, Libra–Atena, Escorpião–Dionísio, Sagitário–Hefesto, Capricórnio–Ártemis,
  Aquário–Apolo, Peixes–Poseidon. O patrono só define a casa inicial.
- Parar numa casa de Bifurcação ou na casa 52 (Tártaro) por movimento não tem efeito.
- Empates de "líder" e "menos Glória": vale o primeiro na ordem do turno a partir do jogador ativo.
  O mesmo vale para a vitória quando dois passam da meta juntos.
- Baralho vazio: o descarte é reembaralhado. Mão vazia: o jogador pode encerrar o turno sem agir
  (isso é permitido a qualquer momento).
- Ação de templo: uma vez por jogador por rodada (a recomendação da seção 8).
- Oráculo: ganha +1 Glória a cada eleição vencida, inclusive reeleição. A Proteção do Destino é
  oferecida quando um Arcano Maior prejudicaria o Oráculo.
- Descontos: o do signo soma com um único desconto de carta/relíquia (Pajem de Espadas ou Martelo).
- Relíquias passivas valem assim que compradas e continuam valendo na prisão; as manuais não.
  Égide e Arco agem sozinhos na primeira ocasião da rodada.
- Foice rende no início de cada rodada a partir da segunda; Cinto rende ao fim das rodadas 3, 6, 9…
- "Teletransportar até N casas adiante" permite ficar onde está.

## Telemetria inicial (IA × IA, meta de 20 Glórias)

| Jogadores | Rodadas (média) | p10–p90 | Duelos/partida | Prisões/jogador | Relíquias/jogador |
|---|---|---|---|---|---|
| 2 | 27,0 | 19–33 | 0,3 | 0,01 | 1,1 |
| 3 | 25,2 | 19–32 | 0,8 | 0,02 | 1,1 |
| 4 | 23,8 | 18–29 | 1,4 | 0,03 | 1,0 |

Comparado à meta da seção 15: as partidas estão mais longas que 12–20 rodadas, há poucos duelos
e quase nenhuma prisão. A Húbris só é cobrada ao parar em uma das 4 casas de Nêmesis.
