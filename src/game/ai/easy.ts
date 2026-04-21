import { getValidMoves, placeEdge } from "../rules";
import type { GameState } from "../state";

function cloneState(state: GameState): GameState {
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

function randomMove(moves: Array<[number, number]>): [number, number] | null {
  if (moves.length === 0) {
    return null;
  }

  return moves[Math.floor(Math.random() * moves.length)] ?? null;
}

export function chooseMove(state: GameState): [number, number] | null {
  const validMoves = getValidMoves(state);

  if (validMoves.length === 0) {
    return null;
  }

  const currentPlayer = state.players[state.currentTurnIndex];
  if (!currentPlayer) {
    return null;
  }

  const triangleMoves = validMoves.filter(([starA, starB]) => {
    const simulatedState = cloneState(state);
    const result = placeEdge(starA, starB, currentPlayer.id, simulatedState);
    return result.success && result.newTriangles.length > 0;
  });

  return randomMove(triangleMoves) ?? randomMove(validMoves);
}
