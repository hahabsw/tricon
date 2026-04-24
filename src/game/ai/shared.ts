import { getNextPlayerIndex, placeEdge } from "../rules";
import type { GameState } from "../state";

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    stars: state.stars.map((star) => ({ ...star })),
    edges: state.edges.map((edge) => ({ ...edge })),
    triangles: state.triangles.map((triangle) => ({
      ...triangle,
      stars: [...triangle.stars] as [number, number, number],
      edges: [...triangle.edges] as [number, number, number],
    })),
    players: state.players.map((player) => ({ ...player })),
    scores: { ...state.scores },
    settings: { ...state.settings },
  };
}

export function randomMove(
  moves: Array<[number, number]>
): [number, number] | null {
  if (moves.length === 0) {
    return null;
  }

  return moves[Math.floor(Math.random() * moves.length)] ?? null;
}

export type SimulationResult = {
  state: GameState;
  area: number;
  trianglesCount: number;
  bonusTurn: boolean;
};

/**
 * Clone state, apply the move as playerId, and advance the turn (including
 * bonus-turn logic). Returns null if the move was invalid.
 */
export function simulateMove(
  state: GameState,
  move: [number, number],
  playerId: string
): SimulationResult | null {
  const clone = cloneState(state);
  const result = placeEdge(move[0], move[1], playerId, clone);
  if (!result.success) {
    return null;
  }

  clone.consecutivePasses = 0;
  clone.turnNumber += 1;
  if (!result.bonusTurn) {
    clone.currentTurnIndex = getNextPlayerIndex(clone);
  }

  const area = result.newTriangles.reduce((sum, tri) => sum + tri.area, 0);
  return {
    state: clone,
    area,
    trianglesCount: result.newTriangles.length,
    bonusTurn: result.bonusTurn,
  };
}
