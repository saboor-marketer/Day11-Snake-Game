export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type ArenaMode = 'WALLS' | 'WRAP';
export type SpeedPreset = 'ARCADE' | 'TURBO';

export interface Point {
  x: number;
  y: number;
}

export type FoodKind = 'STANDARD' | 'GOLDEN';

export interface FoodItem {
  x: number;
  y: number;
  kind: FoodKind;
  spawnTime: number;
  duration?: number; // For timed GOLDEN cores (in ms)
  points: number;
}

export interface Particle {
  x: number; // In normalized grid units (e.g. 0..20)
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'CIRCLE' | 'SQUARE' | 'SPARK';
  rotation: number;
  vRot: number;
}

export interface ShockwaveRing {
  x: number; // Grid center coordinate (e.g., 10.5)
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
  lineWidth: number;
}

export interface GridFlash {
  x: number; // Grid integer cell
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface FloatingPopup {
  id: number;
  x: number; // Grid coordinate
  y: number;
  text: string;
  subText?: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface DigestWave {
  segmentIndexFloat: number; // Travels from 0 to snake.length
  speed: number; // Segments per second
  color: string;
  intensity: number;
}

export interface LeaderboardEntry {
  id: string;
  callsign: string;
  score: number;
  maxCombo: number;
  length: number;
  mode: ArenaMode;
  timestamp: number;
  isNew?: boolean;
}

export interface SessionStats {
  score: number;
  foodEaten: number;
  goldenEaten: number;
  maxCombo: number;
  length: number;
  survivalTimeMs: number;
  causeOfDeath: 'WALL' | 'SELF' | 'NONE';
}
