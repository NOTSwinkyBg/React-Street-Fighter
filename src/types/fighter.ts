export type PlayerId = 'player1' | 'player2';
//Добави
export type GameMode = 'local' | 'ai' | 'online';
export type Screen = 'menu' | 'lobby' | 'game';

export interface Fighter {
  id: PlayerId;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number; // Скорост по X
  vy: number; // Скорост по Y
  health: number;
  isPunching: boolean;
  punchTimer: number;
  facing: 1 | -1; // 1 = Надясно, -1 = Наляво
  color: string;
  controls: { left: string; right: string; jump: string; punch: string };
  lastThink?: number; // За AI
}