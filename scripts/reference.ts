// Gera docs/REFERENCIA.md a partir dos dados do motor, para a referência nunca divergir do jogo.
import { writeFileSync } from 'node:fs';
import { HOUSES, NODES, RETURNS, SHORTCUTS, templeOf } from '../src/engine/board';
import { cardName, CARDS, SAB_CARDS, SUITS, useLabel } from '../src/engine/cards';
import { CONTRACTS, EVENTS, RULES, SABOTAGES, TABLES, TRAPS } from '../src/engine/config';
import { AFFINITY, ELEMENT_NAME, ELEMENT_SUIT, GODS, SIGNS, SUIT_ELEMENT } from '../src/engine/data';
import { DESTINIES } from '../src/engine/destiny';
import type { HouseType } from '../src/engine/types';

const pad = (n: number): string => String(n).padStart(2, '0');
const table = (head: string[], rows: (string | number)[][]): string =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
const RES = { gloria: 'Glória', dracmas: 'Dracmas', favor: 'Favor', hubris: 'Húbris' };
const onOff = (n: number): string => (n > 0 ? 'Ligado' : 'Desligado');
const out: string[] = [];
const h = (title: string, body: string): void => void out.push(`## ${title}\n\n${body}\n`);

out.push(`# Ascensão ao Olimpo — Referência de correspondências

Arquivo gerado por \`npm run reference\` a partir do código em \`src/engine\`. Não edite à mão:
altere os dados no motor e gere de novo.
`);

h('1. Parâmetros gerais', table(['Parâmetro', 'Valor'], [
  ['Jogadores', '2 a 4, humanos e/ou IA'],
  ['Glória para vencer', RULES.goal],
  ['Cartas na mão', RULES.hand],
  ['Recursos iniciais', `${RULES.startDracmas} Dracmas, ${RULES.startFavor} Favor, 0 Húbris, 0 Glória`],
  ['Teto de Favor', RULES.favorCap],
  ['Relíquias por jogador', RULES.maxRelics],
  ['Eleição do Oráculo', `a cada ${RULES.electionEvery} rodadas`],
  ['Evento global', `a cada ${RULES.eventEvery} rodadas, após a eleição (${onOff(RULES.modEvents)})`],
  ['Teto de Dracmas de passagem', `${RULES.passDracmaCap} por movimento`],
  ['Ira de Nêmesis', `encerrar o turno com ${RULES.wrathHubris}+ de Húbris leva ao Tártaro; a Húbris cai para ${RULES.wrathReset}`],
  ['Suborno no Tártaro', `${RULES.bail} Dracmas`],
  ['Multa de Nêmesis (Húbris 4–5)', `${RULES.nemesisFine} Dracmas`],
  ['Aposta máxima em duelo', `${RULES.maxBid} Favores`],
  ['Ascensão de Zeus', `1 vez a cada ${RULES.gloryActionCooldown} rodadas por jogador`],
  ['Armadilhas', `${RULES.trapMax} por jogador, ${RULES.trapRounds} rodadas (${onOff(RULES.modTraps)})`],
  ['Sabotagens recebidas', `no máximo ${RULES.sabotageInPerRound} por rodada`],
  ['Sabotagem direta', onOff(RULES.modSabotage)],
  ['Contratos divinos', `${onOff(RULES.modContracts)}; abandonar custa ${RULES.contractAbandon} Dracmas`],
]));

h('2. Recursos', table(['Recurso', 'Para que serve'], [
  ['Glória', `Pontos de vitória: vence quem chegar a ${RULES.goal}.`],
  ['Dracmas', 'Pagam efeitos de cartas, ações de templo, relíquias, armadilhas, pedágios e o suborno do Tártaro.'],
  ['Favor', `Votos na eleição do Oráculo (não é gasto), apostas em duelos e algumas ações. Máximo ${RULES.favorCap}.`],
  ['Húbris', 'Risco acumulado: é cobrada em Nêmesis e pode levar ao Tártaro.'],
]));

h('3. Elementos e naipes', table(['Elemento', 'Naipe', 'Signos', 'Deuses (templos do elemento)'],
  (['fogo', 'agua', 'ar', 'terra'] as const).map((e) => [
    ELEMENT_NAME[e], ELEMENT_SUIT[e],
    SIGNS.filter((s) => s.element === e).map((s) => s.name).join(', '),
    GODS.filter((g) => g.element === e).map((g) => g.name).join(', '),
  ])) + '\n\nCartas do naipe do elemento do seu signo custam 1 Dracma a menos no efeito (mínimo 0).');

h('4. Personagens: signos', table(['Signo', 'Glifo', 'Elemento', 'Naipe com desconto', 'Deus patrono', 'Casa inicial'],
  SIGNS.map((s) => [s.name, s.glyph, ELEMENT_NAME[s.element], ELEMENT_SUIT[s.element], GODS[s.patron].name, pad(templeOf(s.patron))]))
  + '\n\nA tabela signo–patrono é provisória. O patrono define apenas a casa inicial.');

h('5. Deuses, regiões e templos', table(['Região', 'Deus', 'Elemento', 'Casas', 'Templo', 'Signos patrocinados'],
  GODS.map((g, r) => [r + 1, g.name, ELEMENT_NAME[g.element], `${pad(r * 8)}–${pad(r * 8 + 7)}`, pad(templeOf(r)),
    SIGNS.filter((s) => s.patron === r).map((s) => s.name).join(', ') || '—'])));

h('6. Ações dos templos',
  'Só ao **chegar** ao templo por movimento. O jogador escolhe uma opção: ação principal, ação secundária, relíquia, efeito de carta permitida ali, ou nada.\n\n'
  + table(['Deus', 'Ação principal', 'Efeito', 'Ação secundária', 'Efeito'],
    GODS.map((g) => [g.name, g.primary.name, g.primary.text, g.secondary.name, g.secondary.text]))
  + '\n\nAções políticas adicionais (v1.9):\n\n'
  + table(['Templo', 'Ação', 'Custo', 'Efeito'], [
    ['Hera', 'Campanha', '3 Dracmas', '+1 Favor'],
    ['Atena', 'Intriga', '3 Dracmas', 'Um adversário perde 1 Favor (conta como sabotagem política)'],
    ['Zeus', 'Decreto de Proteção', '2 Favores', 'Anula a próxima sabotagem política contra você, até a eleição'],
  ]));

h('7. Relíquias', table(['Relíquia', 'Templo', 'Preço', 'Efeito'], GODS.map((g) => [g.relic.name, g.name, g.relic.price, g.relic.text])));

const types = Object.keys(HOUSES) as HouseType[];
h('8. Tipos de casa', table(['Tipo', 'Qtde.', 'Passagem', 'Parada', 'IDs'],
  types.map((t) => [HOUSES[t].name, NODES.filter((n) => n.type === t).length, HOUSES[t].pass || '—', HOUSES[t].stop,
    NODES.filter((n) => n.type === t).map((n) => pad(n.id)).join(', ')])));

h('9. Tabelas de dado', [
  '**Provação (1d6)**\n\n' + table(['Dado', 'Efeito'], TABLES.provacao.map((r, i) => [i + 1, r.text])),
  '**Evento (1d6)**\n\n' + table(['Dado', 'Efeito'], TABLES.evento.map((r, i) => [i + 1, r.text])),
  '**Altar** — aposta de 1 a 3 Dracmas; cada Dracma além do primeiro soma 1 ao dado.\n\n'
    + table(['Total', 'Resultado'], [['1–2', 'Perde a aposta'], ['3–4', '+1 Favor'], ['5 ou mais', '+2 Favores']]),
  `**Tesouro** — +${RULES.treasureMin} a ${RULES.treasureMax} Dracmas, sorteio uniforme.`,
  '**Caçada de Ártemis (1d6)** — ganha o valor do dado em Dracmas, limitado a 5. Resultado 1: +1 Húbris.',
  '**Tesouro Submerso de Poseidon (1d6)** — ganha dado + 1 Dracmas (2 a 7). Resultado 1: +1 Húbris.',
  '**Cassino Divino de Dionísio (1d6)** — aposta de 1 a 3 Dracmas. Com 4, 5 ou 6 recebe o dobro; com 1 a 3 perde.',
  '**Julgamento de Atena** — cada lado rola 1d6. Se quem age tirar mais, toma até 2 Favores; senão, +1 Húbris.',
].join('\n\n'));

h('10. Nêmesis e Tártaro', table(['Situação', 'Efeito'], [
  [`Passar por Nêmesis com Húbris ≥ ${RULES.nemesisPassHubris}`, `Paga ${RULES.nemesisPassToll} Dracma; sem saldo, +${RULES.tollHubris} Húbris`],
  ['Parar em Nêmesis com Húbris 0–1', 'Nada'],
  ['Parar em Nêmesis com Húbris 2–3', 'Perde até 2 Dracmas'],
  ['Parar em Nêmesis com Húbris 4–5', `Paga ${RULES.nemesisFine} Dracmas ou vai ao Tártaro`],
  ['Parar em Nêmesis com Húbris 6+', 'Tártaro'],
  [`Encerrar o turno com Húbris ${RULES.wrathHubris}+`, `Tártaro; a Húbris cai para ${RULES.wrathReset}`],
  ['Tártaro: Penitência', 'Perde a ação, remove 2 Húbris e sai ao fim do turno'],
  ['Tártaro: Suborno', `Paga ${RULES.bail} Dracmas, sai e age`],
  ['Tártaro: Pacto Sombrio', 'Perde 1 Glória, ganha 2 Húbris, sai e age'],
]));

h('11. Mapa: as 96 casas', table(['Casa', 'Região', 'Tipo', 'Saídas'],
  NODES.map((n) => [pad(n.id), GODS[n.region].name, n.type === 'templo' ? `**Templo de ${GODS[n.region].name}**` : HOUSES[n.type].name,
    n.next.map((x, i) => pad(x) + (i === 1 ? (SHORTCUTS[n.id] !== undefined ? ' (atalho)' : ' (retorno)') : '')).join(', ')])));

h('12. Bifurcações e retornos',
  'Atalhos (levam à volta de dentro da espiral, ou de volta ao início):\n\n'
  + table(['Origem', 'Saída normal', 'Atalho'], Object.entries(SHORTCUTS).map(([a, b]) => [pad(+a), pad(+a + 1), pad(b)]))
  + '\n\nRetornos (levam à volta de fora; fecham anéis de 27 passos):\n\n'
  + table(['Origem', 'Tipo da casa', 'Saída normal', 'Retorno'], Object.entries(RETURNS).map(([a, b]) => [pad(+a), HOUSES[NODES[+a].type].name, pad(+a + 1), pad(b)])));

const where = (id: number): string => {
  const c = CARDS[id];
  const extra = AFFINITY.map((list, r) => (list.includes(id) ? GODS[r].name : '')).filter(Boolean);
  if (c.use === 'U') return 'Qualquer casa';
  const base = c.use === 'D' ? [GODS[c.god!].name] : GODS.filter((g) => g.element === SUIT_ELEMENT[c.suit]).map((g) => g.name);
  return [...new Set([...base, ...extra])].join(', ');
};
h('13. Arcanos Menores (56 cartas)',
  'Cada carta serve para **mover** (descarta e anda exatamente o movimento) ou para o **efeito** (paga o custo, não move). '
  + 'U = universal, E = elemental, D = divina.\n\n'
  + SUITS.map((suit) => `### ${suit} — ${ELEMENT_NAME[SUIT_ELEMENT[suit]]}\n\n` + table(['Carta', 'Mov.', 'Custo', 'Uso', 'Templos onde o efeito vale', 'Efeito', 'Sabotagem'],
    CARDS.filter((c) => c.suit === suit).map((c) => [cardName(c), c.move, c.cost, useLabel(c), where(c.id), c.text, SAB_CARDS[c.id] ?? '—']))).join('\n\n'));

h('14. Afinidades de cartas por templo', table(['Templo', 'Cartas afins (também podem ser jogadas ali)'],
  GODS.map((g, r) => [g.name, AFFINITY[r].map((c) => cardName(CARDS[c])).join(', ')])));

h('15. Arcanos Maiores (22 cartas do Destino)', table(['Nº', 'Arcano', 'Efeito'], DESTINIES.map((d) => [d.numeral, d.name, d.text])));

h('16. Armadilhas', `Ação principal: descartar uma carta, pagar o custo e escolher a casa (exceto templos, Delfos, Tártaro e Nêmesis).\n\n`
  + table(['Armadilha', 'Custo', 'Efeito na vítima'], TRAPS.map((t) => [t.name, `${t.cost} Dracmas`, t.text])));

h('17. Sabotagens', 'Cartas existentes que contam como sabotagem:\n\n'
  + table(['Carta', 'Tipo', 'Efeito'], Object.entries(SAB_CARDS).map(([id, kind]) => [cardName(CARDS[+id]), kind, CARDS[+id].text]))
  + `\n\nSabotagens diretas (${onOff(RULES.modSabotage).toLowerCase()}, aguardando aprovação do design):\n\n`
  + table(['Tipo', 'Custo', 'Efeito'], Object.values(SABOTAGES).map((s) => [s.name, `${s.dracmas} Dracmas${s.favor ? ` + ${s.favor} Favor` : ''}`, s.text])));

h('18. Investimentos', table(['Investimento', 'Templo', 'Custo', 'Renda', 'Duração', 'Total'], [
  ['Forja Produtiva', 'Hefesto', `${RULES.forgeCost} Dracmas`, '+1 Dracma por rodada', `${RULES.forgeTotal} rodadas`, `${RULES.forgeTotal} Dracmas`],
  ['Colheita Sagrada', 'Deméter', `${RULES.harvestCost} Dracmas`, `+${RULES.harvestYield} Dracmas por rodada`, `${RULES.harvestRounds} rodadas`, `${RULES.harvestRounds * RULES.harvestYield} Dracmas`],
]));

h('19. Eventos globais', table(['Evento', 'Efeito'], EVENTS.map((e) => [e.name, e.text])));

h('20. Contratos divinos', `Módulo ${onOff(RULES.modContracts).toLowerCase()} por padrão.\n\n`
  + table(['Deus', 'Objetivo', 'Meta', 'Recompensa'], CONTRACTS.map((c, r) => [GODS[r].name, c.text, c.goal, c.reward.map(([res, n]) => `+${n} ${RES[res]}`).join(', ')])));

h('21. Oráculo de Delfos e duelos', table(['Regra', 'Valor'], [
  ['Votos', 'Favor atual (+1 com a Coroa de Hera); o Favor não é gasto'],
  ['Desempate', 'Menos Húbris, depois menos Glória; persistindo, cargo vago'],
  ['Ao ser eleito', '+1 Glória'],
  ['Visão Profética', 'Ver 3 cartas do Destino, grátis, 1 vez por rodada'],
  ['Tecelagem', 'Reorganizar 3 cartas do Destino por 2 Favores, 1 vez por mandato'],
  ['Proteção do Destino', 'Ignorar um Arcano Maior que o prejudique, por 3 Favores, 1 vez por mandato'],
  ['Duelo: lances', `Cada lado aposta de 0 a ${RULES.maxBid} Favores em segredo; ambos são gastos`],
  ['Duelo: força', `Aposta + 1 (Lança de Ares) + ${RULES.duelPrep} (Preparação de Guerra)`],
  ['Duelo: atacante vence', 'Toma até 2 Dracmas (ou 1 Glória no Confronto de Ares)'],
  ['Duelo: defensor vence', 'Recebe até 1 Favor do atacante'],
  ['Duelo: empate', 'Sem prêmio'],
]));

writeFileSync('docs/REFERENCIA.md', out.join('\n'));
console.log(`docs/REFERENCIA.md gerado (${out.join('\n').split('\n').length} linhas).`);
