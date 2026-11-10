export type Element = 'fogo' | 'terra' | 'ar' | 'agua';
export type Suit = 'Paus' | 'Ouros' | 'Espadas' | 'Copas';
export type Res = 'gloria' | 'dracmas' | 'favor' | 'hubris';

export type HouseType =
  | 'templo'
  | 'oferenda'
  | 'tributo'
  | 'nemesis'
  | 'moiras'
  | 'fortuna'
  | 'visao'
  | 'purificacao'
  | 'tentacao'
  | 'iris'
  | 'duelo';

export interface BoardNode {
  id: number;
  type: HouseType;
  /** Região (0–11), na ordem do zodíaco. */
  sector: number;
  ring: 'outer' | 'inner' | 'temple';
  x: number;
  y: number;
  /** Casas alcançáveis com um passo (as trilhas têm sentido fixo). */
  next: number[];
}

export type Who = 'all' | 'leader' | 'richest';

export type Effect =
  | { t: 'self'; res: Res; n: number }
  | { t: 'foes'; who: Who; res: Res; n: number }
  | { t: 'steal'; who: Who; res: 'dracmas' | 'favor'; n: number }
  | { t: 'draw'; n: number }
  | { t: 'jail'; who: 'leader' | 'richest' };

export interface Card {
  id: number;
  /** Região cujo templo permite jogar a carta. */
  sector: number;
  suit: Suit;
  rank: string;
  title: string;
  move: number;
  cost: number;
  effects: Effect[];
}

export type DestinyTarget = 'active' | 'all' | 'others' | 'leader' | 'last';

export type DestinyOp =
  | { t: 'res'; to: DestinyTarget; res: Res; n: number }
  | { t: 'draw'; to: DestinyTarget; n: number }
  | { t: 'redraw' }
  | { t: 'justice' }
  | { t: 'judgement' };

export interface Destiny {
  id: number;
  numeral: string;
  name: string;
  text: string;
  ops: DestinyOp[];
}

export interface Player {
  id: number;
  name: string;
  /** Índice do signo, igual ao índice da região do deus patrono. */
  sign: number;
  isAI: boolean;
  pos: number;
  gloria: number;
  dracmas: number;
  favor: number;
  hubris: number;
  hand: number[];
  /** Turnos de pena restantes no Tártaro (0 = livre). */
  jail: number;
}

export type Phase = 'jail' | 'move' | 'action' | 'over';

export interface LogEntry {
  player: number | null;
  text: string;
}

export interface GameState {
  players: Player[];
  current: number;
  phase: Phase;
  round: number;
  deck: number[];
  discard: number[];
  destiny: number[];
  destinyDiscard: number[];
  lastDestiny: number | null;
  log: LogEntry[];
  winner: number | null;
  seed: number;
  goal: number;
}

export interface PlayerConfig {
  name: string;
  sign: number;
  isAI: boolean;
}
