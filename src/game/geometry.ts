// ============================================================
// Tricon - Geometry Utilities
// Line intersection, triangle detection, area calculation
// ============================================================

import { Point, Star, Edge, Triangle } from "./state";

// ============================================================
// Line Segment Intersection (CCW method)
// ============================================================

/**
 * Returns the cross product sign (counter-clockwise test).
 * Positive = CCW, Negative = CW, Zero = collinear
 */
function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Check if point C lies on segment AB (assuming collinearity).
 */
function onSegment(a: Point, c: Point, b: Point): boolean {
  return (
    Math.min(a.x, b.x) <= c.x + 1e-10 &&
    c.x <= Math.max(a.x, b.x) + 1e-10 &&
    Math.min(a.y, b.y) <= c.y + 1e-10 &&
    c.y <= Math.max(a.y, b.y) + 1e-10
  );
}

/**
 * Check if two line segments (p1→p2) and (p3→p4) properly intersect.
 * "Properly" means they cross each other's interior, not just touch at endpoints.
 * Shared endpoints are NOT considered intersections (important for our game).
 */
export function segmentsIntersect(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): boolean {
  const d1 = cross(p3, p4, p1);
  const d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3);
  const d4 = cross(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  // Collinear cases - check if segments overlap
  const eps = 1e-10;
  if (Math.abs(d1) < eps && onSegment(p3, p1, p4)) return true;
  if (Math.abs(d2) < eps && onSegment(p3, p2, p4)) return true;
  if (Math.abs(d3) < eps && onSegment(p1, p3, p2)) return true;
  if (Math.abs(d4) < eps && onSegment(p1, p4, p2)) return true;

  return false;
}

/**
 * Check if a proposed edge between two stars would cross any existing edge.
 * Edges sharing an endpoint (star) are excluded from intersection check.
 */
export function wouldIntersectExistingEdges(
  starA: Star,
  starB: Star,
  existingEdges: Edge[],
  stars: Star[]
): boolean {
  const starMap = new Map(stars.map((s) => [s.id, s]));
  const p1: Point = { x: starA.x, y: starA.y };
  const p2: Point = { x: starB.x, y: starB.y };

  for (const edge of existingEdges) {
    // Skip edges that share an endpoint with the proposed edge
    if (
      edge.starA === starA.id ||
      edge.starA === starB.id ||
      edge.starB === starA.id ||
      edge.starB === starB.id
    ) {
      continue;
    }

    const eA = starMap.get(edge.starA);
    const eB = starMap.get(edge.starB);
    if (!eA || !eB) continue;

    const p3: Point = { x: eA.x, y: eA.y };
    const p4: Point = { x: eB.x, y: eB.y };

    if (segmentsIntersect(p1, p2, p3, p4)) {
      return true;
    }
  }

  return false;
}

// ============================================================
// Triangle Detection
// ============================================================

/**
 * Build an adjacency list from edges.
 * Returns Map<starId, Set<starId>>
 */
export function buildAdjacencyList(edges: Edge[]): Map<number, Set<number>> {
  const adj = new Map<number, Set<number>>();

  for (const edge of edges) {
    if (!adj.has(edge.starA)) adj.set(edge.starA, new Set());
    if (!adj.has(edge.starB)) adj.set(edge.starB, new Set());
    adj.get(edge.starA)!.add(edge.starB);
    adj.get(edge.starB)!.add(edge.starA);
  }

  return adj;
}

/**
 * Find the edge ID connecting two stars, or undefined if none exists.
 */
export function findEdge(
  edges: Edge[],
  starIdA: number,
  starIdB: number
): Edge | undefined {
  const a = Math.min(starIdA, starIdB);
  const b = Math.max(starIdA, starIdB);
  return edges.find((e) => e.starA === a && e.starB === b);
}

/**
 * Detect new triangles formed by adding an edge between starA and starB.
 * Finds all common neighbors of starA and starB that complete a triangle.
 */
export function detectNewTriangles(
  starAId: number,
  starBId: number,
  edges: Edge[],
  existingTriangles: Triangle[]
): Array<{ stars: [number, number, number]; edges: [number, number, number] }> {
  const adj = buildAdjacencyList(edges);
  const neighborsA = adj.get(starAId) || new Set<number>();
  const neighborsB = adj.get(starBId) || new Set<number>();

  // Find common neighbors
  const commonNeighbors: number[] = [];
  for (const n of neighborsA) {
    if (neighborsB.has(n)) {
      commonNeighbors.push(n);
    }
  }

  const existingTriangleKeys = new Set(
    existingTriangles.map((t) => t.stars.join(","))
  );

  const newTriangles: Array<{
    stars: [number, number, number];
    edges: [number, number, number];
  }> = [];

  for (const c of commonNeighbors) {
    // Sort star IDs for consistent key
    const triStars = [starAId, starBId, c].sort((a, b) => a - b) as [
      number,
      number,
      number,
    ];
    const key = triStars.join(",");

    if (existingTriangleKeys.has(key)) continue;

    // Find the three edges
    const e1 = findEdge(edges, triStars[0], triStars[1]);
    const e2 = findEdge(edges, triStars[0], triStars[2]);
    const e3 = findEdge(edges, triStars[1], triStars[2]);

    if (e1 && e2 && e3) {
      newTriangles.push({
        stars: triStars,
        edges: [e1.id, e2.id, e3.id],
      });
    }
  }

  return newTriangles;
}

// ============================================================
// Area Calculation
// ============================================================

/**
 * Calculate the area of a triangle using the Shoelace formula.
 * Stars should have normalized coordinates (0~1).
 * Returns the absolute area value.
 */
export function triangleArea(a: Point, b: Point, c: Point): number {
  return (
    0.5 *
    Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y))
  );
}

/**
 * Calculate triangle area from star IDs.
 */
export function calculateTriangleArea(
  starIds: [number, number, number],
  stars: Star[]
): number {
  const starMap = new Map(stars.map((s) => [s.id, s]));
  const a = starMap.get(starIds[0]);
  const b = starMap.get(starIds[1]);
  const c = starMap.get(starIds[2]);

  if (!a || !b || !c) return 0;

  return triangleArea(a, b, c);
}

// ============================================================
// Star Generation
// ============================================================

/**
 * Generate random star positions with minimum distance guarantee.
 * Uses rejection sampling to ensure no two stars are too close.
 */
export function generateStars(
  count: number,
  minDistance: number,
  padding: number = 0.05 // keep stars away from field edges
): Star[] {
  const stars: Star[] = [];
  const maxAttempts = count * 100; // prevent infinite loops
  let attempts = 0;

  while (stars.length < count && attempts < maxAttempts) {
    attempts++;

    const x = padding + Math.random() * (1 - 2 * padding);
    const y = padding + Math.random() * (1 - 2 * padding);

    // Check minimum distance to all existing stars
    let tooClose = false;
    for (const existing of stars) {
      const dx = x - existing.x;
      const dy = y - existing.y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      stars.push({
        id: stars.length,
        x,
        y,
        connectionCount: 0,
      });
    }
  }

  return stars;
}

/**
 * Calculate distance between two points.
 */
export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
