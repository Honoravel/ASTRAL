export type Element = 'fogo' | 'agua' | 'ar' | 'terra';
export type Suit = 'Paus' | 'Copas' | 'Espadas' | 'Ouros';
export type Res = 'gloria' | 'dracmas' | 'favor' | 'hubris';

export type HouseType =
  | 'comum' | 'dracmas' | 'pedagio' | 'favor' | 'gloria' | 'provacao' | 'destino' | 'nemesis'
  | 'bifurcacao' | 'templo' | 'evento' | 'altar' | 'tesouro' | 'delfos' | 'tartaro';

/** Efeito de casa, definido por dados (passagem ou parada). */
export type EffectDefinition =
  | { k: 'res'; res: Res; n: number }
  | { k: 'toll'; n: number }
  | { k: 'hubrisToll'; min: number; n: number }
  | { k: 'roll'; table: 'provacao' | 'evento' }
  | { k: 'treasure'; min: number; max: number }
  | { k: 'altar' }
  | { k: 'destiny' }
  | { k: 'judgement' }
  | { k: 'temple' }
  | { k: 'delphi' };

/** Registro do último movimento por carta. */
export interface MovementResult {
  player: number;
  path: number[];
  passedNodes: number[];
  destination: number;
  /** Efeitos de passagem aplicados, em ordem. */
  events: { node: number; text: string }[];
}

export interface BoardNode {
  id: number;
  region: number;
  type: HouseType;
  next: number[];
  position: { x: number; y: number };
  elevation: number;
  onPass: EffectDefinition[];
  onStop: EffectDefinition[];
}

export interface Card {
  id: number;
  suit: Suit;
  rank: string;
  move: number;
  cost: number;
  /** U = universal, E = elemental (templos do elemento), D = divina (templo nomeado). */
  use: 'U' | 'E' | 'D';
  god: number | null;
  text: string;
}

export interface ChoiceOption {
  label: string;
  ops: Op[];
  disabled?: boolean;
}

/** Passo da fila de efeitos. Tudo é serializável para permitir salvar no meio de uma decisão. */
export type Op =
  | { t: 'turnStart'; p: number }
  | { t: 'res'; p: number; res: Res; n: number; raw?: boolean }
  | { t: 'refill'; p: number }
  | { t: 'transfer'; from: number; to: number; res: Res; n: number }
  | { t: 'target'; p: number; prompt: string; good?: boolean; filter?: 'free' | 'rich3'; sab?: string; ops: Op[] }
  | { t: 'choice'; p: number; prompt: string; options: ChoiceOption[] }
  | { t: 'draw'; p: number; n: number }
  | { t: 'discard'; p: number; n: number }
  | { t: 'discardRandom'; p: number; n: number }
  | { t: 'peek'; p: number; deck: 'minor' | 'destiny'; n: number; reorder: boolean }
  | { t: 'viewHand'; p: number; of: number }
  | { t: 'swap'; p: number; of: number }
  | { t: 'advance'; p: number; who: number; min: number; max: number }
  | { t: 'teleport'; p: number; kind: 'common' | 'adjacent' | 'next' }
  | { t: 'jail'; p: number }
  | { t: 'release'; p: number }
  | { t: 'shield'; p: number }
  | { t: 'discountNext'; p: number }
  | { t: 'paus9'; p: number }
  | { t: 'behind'; p: number }
  | { t: 'enforcado'; p: number }
  | { t: 'redraw' }
  | { t: 'revealRandom' }
  | { t: 'destiny'; p: number }
  | { t: 'destinyApply'; p: number; id: number; exempt: number }
  | { t: 'protect'; p: number }
  | { t: 'land'; p: number }
  | { t: 'encounter'; p: number }
  | { t: 'duel'; a: number; d: number; stake?: 'gloria'; bidA?: number; bidD?: number }
  | { t: 'zeusMark'; p: number }
  | { t: 'templeRoll'; p: number; kind: 'artemis' | 'poseidon' }
  | { t: 'dispute'; p: number; of: number }
  | { t: 'cassino'; p: number; bet: number }
  | { t: 'invest'; p: number; kind: 'forge' | 'harvest' }
  | { t: 'newHand'; p: number }
  | { t: 'swapUpTo'; p: number; n: number }
  | { t: 'duelBonus'; p: number }
  | { t: 'divineDiscount'; p: number }
  | { t: 'playCard'; p: number; card: number }
  | { t: 'decree'; p: number }
  | { t: 'track'; p: number; kind: string }
  | { t: 'acceptContract'; p: number; god: number }
  | { t: 'sabotage'; p: number; of: number; kind: string }
  | { t: 'buy'; p: number; relic: number }
  | { t: 'altar'; p: number; bet: number }
  | { t: 'log'; p: number | null; text: string }
  | { t: 'endTurn' };

export type PendingKind = 'choice' | 'target' | 'discard' | 'pickCard' | 'reorder' | 'view' | 'dest' | 'bid';

/** Decisão aguardando resposta de um jogador. */
export interface Pending {
  player: number;
  kind: PendingKind;
  prompt: string;
  options?: { label: string; disabled?: boolean }[];
  players?: number[];
  count?: number;
  /** Em descartes: mínimo de cartas (padrão: exatamente `count`). */
  min?: number;
  cards?: number[];
  deck?: 'minor' | 'destiny';
  nodes?: number[];
  max?: number;
  /** Lance secreto: não exibir a outros jogadores. */
  secret?: boolean;
}

export type Answer = number | number[] | null;

export interface Player {
  id: number;
  name: string;
  sign: number;
  isAI: boolean;
  pos: number;
  gloria: number;
  dracmas: number;
  favor: number;
  hubris: number;
  hand: number[];
  relics: number[];
  jailed: boolean;
  shield: boolean;
  discountNext: boolean;
  duelDone: boolean;
  investments: Investment[];
  /** Decreto de Zeus: bloqueia a próxima sabotagem política até a eleição. */
  decree: boolean;
  /** Já sabotou neste turno. */
  sabDone: boolean;
  /** Relíquias bloqueadas até o fim do próprio turno. */
  blocked: boolean;
  contract: ContractState | null;
  /** Deuses cujos contratos este jogador já concluiu. */
  contractsDone: number[];
  /** Força extra no próximo duelo (Preparação de Guerra). */
  duelBonus: number;
  /** Próxima carta divina custa −1 (Aprimoramento). */
  divineDiscount: boolean;
  /** Rodada do último uso da Ascensão de Zeus. */
  gloryRound: number | null;
  /** Usos por rodada (ação de templo, relíquias, visão do Oráculo). */
  used: Record<string, number>;
}

export interface Investment {
  kind: 'forge' | 'harvest';
  incomePerRound: number;
  remainingRounds: number;
  received: number;
}

export interface ContractState {
  god: number;
  progress: number;
  regions: number[];
}

export interface TrapState {
  id: number;
  owner: number;
  node: number;
  /** Índice em TRAPS. */
  kind: number;
  expiresAtRound: number;
}

export interface GlobalEventState {
  id: number;
  startedAtRound: number;
  expiresAtRound: number;
}

export type Phase = 'CHOOSE_ACTION' | 'RESOLVE_EFFECTS' | 'GAME_OVER';

export interface LogEntry {
  player: number | null;
  text: string;
}

export interface GameState {
  version: number;
  players: Player[];
  current: number;
  phase: Phase;
  round: number;
  deck: number[];
  discard: number[];
  destiny: number[];
  destinyDiscard: number[];
  lastDestiny: number | null;
  /** Relíquias ainda disponíveis nos templos (índice = região). */
  stock: boolean[];
  oracle: { holder: number | null; weaveUsed: boolean; protectUsed: boolean };
  queue: Op[];
  pending: Pending | null;
  answer: { v: Answer } | null;
  log: LogEntry[];
  winner: number | null;
  seed: number;
  goal: number;
  /** Estatísticas para telemetria de balanceamento. */
  stats: { duels: number; jails: number[] };
  lastMove: MovementResult | null;
  /** Armadilhas ativas. Só o dono deve vê-las. */
  traps: TrapState[];
  trapSeq: number;
  /** Última armadilha ativada (para a interface mostrar). */
  lastTrap: { seq: number; node: number; kind: number; owner: number; victim: number } | null;
  globalEvent: GlobalEventState | null;
  elections: { round: number; winner: number | null; votes: number[] }[];
  /** Em simulações da IA, a partida para antes de passar a vez. */
  sim?: boolean;
}

export interface PlayerConfig {
  name: string;
  sign: number;
  isAI: boolean;
}

export type FreePower = 'vision' | 'weave' | 'lira' | 'taca' | 'raio';

/** API única de comandos, usada por humanos e pela IA. */
export type Command =
  | { type: 'PLAY_CARD_MOVE'; card: number; dest: number; mod?: -1 | 0 | 1 }
  | { type: 'PLAY_CARD_EFFECT'; card: number }
  | { type: 'BUY_RELIC' }
  | { type: 'FREE_POWER'; power: FreePower }
  | { type: 'PLACE_TRAP'; card: number; kind: number; node: number }
  | { type: 'SABOTAGE'; kind: string; target: number }
  | { type: 'ABANDON_CONTRACT' }
  | { type: 'END_TURN' }
  | { type: 'ANSWER'; value: Answer };
