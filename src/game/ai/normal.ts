import { getValidMoves } from "../rules";
import type { GameState } from "../state";
import { randomMove, simulateMove } from "./shared";

/**
 * Greedy area-weighted AI.
 * - Picks the move that completes the most total triangle area this turn.
 * - If no triangle-completing move exists, prefers moves that touch
 *   higher-connection stars (more likely to set up future triangles).
 */
export function chooseMove(state: GameState): [number, number] | null {
  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) {
    return null;
  }

  const currentPlayer = state.players[state.currentTurnIndex];
  if (!currentPlayer) {
    return null;
  }

  let bestArea = 0;
  const bestMoves: Array<[number, number]> = [];

  for (const move of validMoves) {
    const sim = simulateMove(state, move, currentPlayer.id);
    if (!sim) continue;

    if (sim.area > bestArea) {
      bestArea = sim.area;
      bestMoves.length = 0;
      bestMoves.push(move);
    } else if (sim.area === bestArea && bestArea > 0) {
      bestMoves.push(move);
    }
  }

  if (bestArea > 0) {
    return randomMove(bestMoves);
  }

  const connectionCount = new Map<number, number>();
  for (const star of state.stars) {
    connectionCount.set(star.id, star.connectionCount);
  }

  let bestRank = -1;
  const strategicMoves: Array<[number, number]> = [];
  for (const [a, b] of validMoves) {
    const rank = (connectionCount.get(a) ?? 0) + (connectionCount.get(b) ?? 0);
    if (rank > bestRank) {
      bestRank = rank;
      strategicMoves.length = 0;
      strategicMoves.push([a, b]);
    } else if (rank === bestRank) {
      strategicMoves.push([a, b]);
    }
  }

  return randomMove(strategicMoves) ?? randomMove(validMoves);
}
