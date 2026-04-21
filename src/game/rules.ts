// ============================================================
// Tricon - Game Rules Validation
// Validates moves, checks game end conditions
// ============================================================

import {
  Star,
  Edge,
  Triangle,
  GameState,
  PlaceEdgeResult,
  GameResult,
  MAX_CONNECTIONS_PER_STAR,
  MAX_EDGE_DISTANCE,
} from "./state";
import {
  wouldIntersectExistingEdges,
  detectNewTriangles,
  calculateTriangleArea,
  findEdge,
} from "./geometry";

// ============================================================
// Move Validation
// ============================================================

/**
 * Check if placing an edge between two stars is a valid move.
 * Returns null if valid, error string if invalid.
 */
export function validateEdge(
  starAId: number,
  starBId: number,
  state: GameState
): string | null {
  const { stars, edges } = state;
  const starMap = new Map(stars.map((s) => [s.id, s]));

  const starA = starMap.get(starAId);
  const starB = starMap.get(starBId);

  // Stars must exist
  if (!starA || !starB) {
    return "Invalid star ID";
  }

  // Can't connect a star to itself
  if (starAId === starBId) {
    return "Cannot connect a star to itself";
  }

  // Check connection limit
  if (starA.connectionCount >= MAX_CONNECTIONS_PER_STAR) {
    return `Star ${starAId} has reached maximum connections (${MAX_CONNECTIONS_PER_STAR})`;
  }
  if (starB.connectionCount >= MAX_CONNECTIONS_PER_STAR) {
    return `Star ${starBId} has reached maximum connections (${MAX_CONNECTIONS_PER_STAR})`;
  }

  const dx = starA.x - starB.x;
  const dy = starA.y - starB.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = MAX_EDGE_DISTANCE[state.settings.starCount] ?? 0.30;
  if (dist > maxDist) {
    return "Stars are too far apart";
  }

  // Check if edge already exists
  const a = Math.min(starAId, starBId);
  const b = Math.max(starAId, starBId);
  if (findEdge(edges, a, b)) {
    return "Edge already exists between these stars";
  }

  // Check intersection with existing edges
  if (wouldIntersectExistingEdges(starA, starB, edges, stars)) {
    return "Edge would cross an existing edge";
  }

  return null;
}

/**
 * Execute placing an edge. Assumes validation has already passed.
 * Returns the result including any new triangles formed.
 */
export function placeEdge(
  starAId: number,
  starBId: number,
  playerId: string,
  state: GameState
): PlaceEdgeResult {
  // Validate first
  const error = validateEdge(starAId, starBId, state);
  if (error) {
    return { success: false, error, newTriangles: [], bonusTurn: false };
  }

  const a = Math.min(starAId, starBId);
  const b = Math.max(starAId, starBId);

  // Create the new edge
  const newEdge: Edge = {
    id: state.edges.length,
    starA: a,
    starB: b,
    placedBy: playerId,
    turnNumber: state.turnNumber,
  };

  // Add edge to state
  state.edges.push(newEdge);

  // Update connection counts
  const starMap = new Map(state.stars.map((s) => [s.id, s]));
  starMap.get(a)!.connectionCount++;
  starMap.get(b)!.connectionCount++;

  // Detect new triangles
  const detected = detectNewTriangles(a, b, state.edges, state.triangles);
  const newTriangles: Triangle[] = detected.map((t, idx) => ({
    id: state.triangles.length + idx,
    stars: t.stars,
    edges: t.edges,
    owner: playerId,
    area: calculateTriangleArea(t.stars, state.stars),
  }));

  // Add triangles to state
  state.triangles.push(...newTriangles);

  // Update scores
  for (const tri of newTriangles) {
    state.scores[playerId] = (state.scores[playerId] || 0) + tri.area;
  }

  const bonusTurn = newTriangles.length > 0;

  return {
    success: true,
    edge: newEdge,
    newTriangles,
    bonusTurn,
  };
}

// ============================================================
// Game End Detection
// ============================================================

/**
 * Get all valid moves for the current game state.
 * Returns array of [starA, starB] pairs.
 */
export function getValidMoves(state: GameState): Array<[number, number]> {
  const moves: Array<[number, number]> = [];
  const { stars } = state;

  for (let i = 0; i < stars.length; i++) {
    if (stars[i].connectionCount >= MAX_CONNECTIONS_PER_STAR) continue;

    for (let j = i + 1; j < stars.length; j++) {
      if (stars[j].connectionCount >= MAX_CONNECTIONS_PER_STAR) continue;

      const error = validateEdge(stars[i].id, stars[j].id, state);
      if (error === null) {
        moves.push([stars[i].id, stars[j].id]);
      }
    }
  }

  return moves;
}

/**
 * Check if the game should end.
 */
export function checkGameEnd(state: GameState): boolean {
  // All players passed consecutively
  if (state.consecutivePasses >= state.players.length) {
    return true;
  }

  // No valid moves remaining
  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) {
    return true;
  }

  return false;
}

/**
 * Calculate final game results.
 */
export function calculateGameResult(state: GameState): GameResult {
  const scores = { ...state.scores };

  // Ensure all players have a score entry
  for (const player of state.players) {
    if (!(player.id in scores)) {
      scores[player.id] = 0;
    }
  }

  // Create rankings
  const rankings = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([playerId, score], idx) => ({
      playerId,
      score,
      rank: idx + 1,
    }));

  return {
    winner: rankings[0]?.playerId || "",
    scores,
    rankings,
  };
}

// ============================================================
// Turn Management Helpers
// ============================================================

/**
 * Get the next player index, skipping disconnected players.
 */
export function getNextPlayerIndex(state: GameState): number {
  const { players, currentTurnIndex } = state;
  let next = (currentTurnIndex + 1) % players.length;

  // Skip disconnected non-AI players (max one full cycle to avoid infinite loop)
  let checked = 0;
  while (checked < players.length) {
    const player = players[next];
    if (player.isAI || player.connected) {
      return next;
    }
    next = (next + 1) % players.length;
    checked++;
  }

  return next;
}

/**
 * Get the current player.
 */
export function getCurrentPlayer(state: GameState) {
  return state.players[state.currentTurnIndex];
}
