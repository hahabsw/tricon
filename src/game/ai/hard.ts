import { getValidMoves } from "../rules";
import type { GameState } from "../state";
import { randomMove, simulateMove } from "./shared";

const OPPONENT_WEIGHT = 0.8;
const MAX_BRANCHING = 50;

function findBestGreedyMove(
  state: GameState,
  playerId: string
): { move: [number, number]; area: number } | null {
  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) {
    return null;
  }

  let best: { move: [number, number]; area: number } | null = null;
  for (const move of validMoves) {
    const sim = simulateMove(state, move, playerId);
    if (!sim) continue;
    if (!best || sim.area > best.area) {
      best = { move, area: sim.area };
    }
  }
  return best;
}

function maxOpponentArea(state: GameState, myPlayerId: string): number {
  const next = state.players[state.currentTurnIndex];
  if (!next || next.id === myPlayerId) {
    return 0;
  }

  const validMoves = getValidMoves(state);
  let maxArea = 0;
  for (const move of validMoves) {
    const sim = simulateMove(state, move, next.id);
    if (!sim) continue;
    if (sim.area > maxArea) {
      maxArea = sim.area;
    }
  }
  return maxArea;
}

/**
 * Hard AI: evaluates each move as
 *   (own triangle area this turn, plus a greedy bonus-turn continuation)
 *   minus a discounted best response the next opponent can make.
 * Prunes the candidate set when the branching factor is too wide.
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

  let candidates = validMoves;
  if (validMoves.length > MAX_BRANCHING) {
    const starConnections = new Map<number, number>();
    for (const star of state.stars) {
      starConnections.set(star.id, star.connectionCount);
    }
    const ranked = validMoves
      .map((move) => ({
        move,
        rank:
          (starConnections.get(move[0]) ?? 0) +
          (starConnections.get(move[1]) ?? 0),
      }))
      .sort((a, b) => b.rank - a.rank)
      .slice(0, MAX_BRANCHING)
      .map((entry) => entry.move);
    candidates = ranked;
  }

  let bestScore = -Infinity;
  const bestMoves: Array<[number, number]> = [];

  for (const move of candidates) {
    const sim = simulateMove(state, move, currentPlayer.id);
    if (!sim) continue;

    let ownGain = sim.area;
    let stateAfter = sim.state;

    if (sim.bonusTurn) {
      const followUp = findBestGreedyMove(stateAfter, currentPlayer.id);
      if (followUp) {
        const chain = simulateMove(stateAfter, followUp.move, currentPlayer.id);
        if (chain) {
          ownGain += chain.area;
          stateAfter = chain.state;
        }
      }
    }

    const oppArea = maxOpponentArea(stateAfter, currentPlayer.id);
    const score = ownGain - OPPONENT_WEIGHT * oppArea;

    if (score > bestScore) {
      bestScore = score;
      bestMoves.length = 0;
      bestMoves.push(move);
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return randomMove(bestMoves) ?? randomMove(validMoves);
}
