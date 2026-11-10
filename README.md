# ASTRAL — Ascensão ao Olimpo

Jogo de tabuleiro digital para 2 a 4 jogadores (humanos no mesmo dispositivo e/ou IA).
Cada jogador nasce sob um signo, é protegido por um deus do Olimpo e disputa a ascensão:
vence quem primeiro chegar a **15 de Glória**.

## Como rodar

```bash
npm install
```

```bash
npm run dev
```

Outros comandos: `npm test` (testes do motor), `npm run build` (versão de produção)
e `npm run sim` (simula partidas só de IA para calibrar o equilíbrio).

## Regras

- **Mapa**: um prato dividido em 12 regiões, uma por deus e signo. Cada região tem um
  único templo e casas de efeito ao longo das trilhas. As trilhas têm sentido fixo: o anel
  externo gira no sentido horário, o interno no anti-horário, e os templos ligam os dois.
- **Turno**: descarte uma carta para andar *exatamente* o valor de movimento dela,
  escolhendo o caminho nas bifurcações. A casa de chegada aplica seu efeito. Se for um
  templo, você pode jogar uma carta daquele deus pagando o custo em dracmas. Ao fim do
  turno, compre até ter 6 cartas.
- **Recursos**: Glória (pontos de vitória), dracmas (pagam cartas), Favor (compra a
  absolvição de Nêmesis) e Húbris (o risco acumulado por cartas poderosas).
- **Signo**: você começa no templo do deus patrono e ganha +1 Favor sempre que parar nele.
  Cartas do naipe do seu elemento custam 1 dracma a menos
  (Fogo/Paus, Terra/Ouros, Ar/Espadas, Água/Copas).
- **Tártaro**: quem é condenado perde turnos, ou paga 4 dracmas de fiança para sair.

| Casa | Efeito |
|---|---|
| Templo | Jogue uma carta do deus; +1 Favor se for o seu patrono |
| Oferenda | +3 dracmas |
| Tributo | −2 dracmas; se não puder pagar tudo, +1 Húbris |
| Nêmesis | Dado ≤ Húbris: Tártaro por 2 turnos (2 Favor absolvem) |
| Moiras | Revela um Arcano Maior (evento que afeta os jogadores) |
| Fortuna | Dado: 1 +1 Húbris · 2 −2 dracmas · 3 +2 dracmas · 4 +3 dracmas · 5 +1 Favor · 6 +1 Glória |
| Visão | Compre 2 cartas |
| Purificação | −2 Húbris |
| Tentação | +1 Glória e +2 Húbris |
| Ponte de Íris | Teleporta para a outra ponte |
| Duelo | Dados contra o adversário mais rico; o vencedor toma 2 dracmas |

## Baralhos

- **Arcanos Menores** (48 cartas, 4 por deus): a mão dos jogadores. Dados em `src/engine/cards.ts`.
- **Arcanos Maiores** (22 cartas): o baralho do Destino. Dados em `src/engine/destiny.ts`.

## Estrutura

- `src/engine/`: regras puras em TypeScript, sem dependência de navegador (tabuleiro,
  cartas, turno, IA). É a parte que será portada para Godot.
- `src/ui/`: interface web (SVG + DOM).
- `tests/`: testes do motor. `scripts/sim.ts`: simulador de partidas.
