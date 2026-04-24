import { getValidMoves } from "../rules";
import type { GameState } from "../state";
import { randomMove, simulateMove } from "./shared";

export function chooseMove(state: GameState): [number, number] | null {
  const validMoves = getValidMoves(state);

  if (validMoves.length === 0) {
    return null;
  }

  const currentPlayer = state.players[state.currentTurnIndex];
  if (!currentPlayer) {
    return null;
  }

  const triangleMoves = validMoves.filter((move) => {
    const sim = simulateMove(state, move, currentPlayer.id);
    return sim !== null && sim.trianglesCount > 0;
  });

  return randomMove(triangleMoves) ?? randomMove(validMoves);
}
