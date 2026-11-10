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
  | { t: 'target'; p: number; prompt: string; good?: boolean; ops: Op[] }
  | { t: 'choice'; p: number; prompt: string; options: ChoiceOption[] }
  | { t: 'draw'; p: number; n: number }
  | { t: 'discard'; p: number; n: number }
  | { t: 'discardRandom'; p: number; n: number }
  | { t: 'peek'; p: number; deck: 'minor' | 'destiny'; n: number; reorder: boolean }
  | { t: 'viewHand'; p: number; of: number }
  | { t: 'swap'; p: number; of: number }
  | { t: 'advance'; p: number; who: number; min: number; max: number }
  | { t: 'teleport'; p: number; kind: 'common' | 'adjacent' }
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
  | { t: 'duel'; a: number; d: number; bidA?: number; bidD?: number }
  | { t: 'payTemple'; p: number; region: number }
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
  /** Usos por rodada (ação de templo, relíquias, visão do Oráculo). */
  used: Record<string, number>;
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
  | { type: 'END_TURN' }
  | { type: 'ANSWER'; value: Answer };
