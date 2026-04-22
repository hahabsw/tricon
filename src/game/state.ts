// ============================================================
// Tricon - Shared Game Types
// Used by both client and server
// ============================================================

/** 2D point on the game field (normalized 0~1) */
export interface Point {
  x: number;
  y: number;
}

/** A star (node) on the game board */
export interface Star {
  id: number;
  x: number; // 0~1 normalized coordinate
  y: number; // 0~1 normalized coordinate
  connectionCount: number; // current number of connected edges (max MAX_CONNECTIONS)
}

/** A line segment connecting two stars */
export interface Edge {
  id: number;
  starA: number; // star id (always smaller id first for consistency)
  starB: number; // star id
  placedBy: string; // playerId who placed this edge
  turnNumber: number; // which turn this was placed on
}

/** A completed triangle territory */
export interface Triangle {
  id: number;
  stars: [number, number, number]; // 3 star ids (sorted ascending)
  edges: [number, number, number]; // 3 edge ids that form this triangle
  owner: string; // playerId who completed it
  area: number; // normalized area (0~1 relative to field)
}

/** Player information */
export interface Player {
  id: string;
  name: string;
  color: string;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
  connected: boolean;
  ready: boolean;
  score: number;
}

/** Full game state */
export interface GameState {
  phase: GamePhase;

  stars: Star[];
  edges: Edge[];
  triangles: Triangle[];

  players: Player[];
  currentTurnIndex: number; // index in players array
  turnNumber: number;
  turnTimeLeft: number; // seconds remaining
  consecutivePasses: number; // track consecutive passes for game end

  scores: Record<string, number>; // playerId → total area score
  settings: GameSettings;
}

/** Room/game settings */
export interface GameSettings {
  maxPlayers: 2 | 3 | 4;
  starCount: 30 | 40 | 50;
  turnTimeSeconds: 10 | 20 | 30;
  fieldWidth: number; // logical field dimensions
  fieldHeight: number;
}

export type GamePhase = "waiting" | "playing" | "paused" | "finished";
export type AIDifficulty = "easy" | "normal" | "hard";

/** Player action: place an edge */
export interface PlaceEdgeAction {
  type: "place_edge";
  starA: number; // star id
  starB: number; // star id
}

/** Player action: pass turn */
export interface PassAction {
  type: "pass";
}

export type PlayerAction = PlaceEdgeAction | PassAction;

/** Result of placing an edge */
export interface PlaceEdgeResult {
  success: boolean;
  error?: string;
  edge?: Edge;
  newTriangles: Triangle[];
  bonusTurn: boolean; // player gets another turn if triangles were completed
}

/** Game over result */
export interface GameResult {
  winner: string; // playerId
  scores: Record<string, number>;
  rankings: Array<{ playerId: string; score: number; rank: number }>;
}

// ============================================================
// Constants
// ============================================================

export const MAX_CONNECTIONS_PER_STAR = 4;
export const MIN_STAR_DISTANCE = 0.08;
export const PLAYER_COLORS = ["#00FFFF", "#FF00FF", "#FFD700", "#00FF88"] as const;

export const MAX_EDGE_DISTANCE: Record<number, number> = {
  30: 0.35,
  40: 0.30,
  50: 0.25,
};

export const DEFAULT_SETTINGS: GameSettings = {
  maxPlayers: 2,
  starCount: 40,
  turnTimeSeconds: 20,
  fieldWidth: 1,
  fieldHeight: 1,
};
