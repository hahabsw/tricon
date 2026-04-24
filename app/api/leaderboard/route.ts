import { NextRequest, NextResponse } from "next/server";

import {
  LeaderboardMetric,
  LeaderboardMode,
  LeaderboardPeriod,
  queryLeaderboard,
} from "../../../src/server/db/leaderboard";
import type { AIDifficulty } from "../../../src/game/state";

const MODES: LeaderboardMode[] = ["pvp", "ai"];
const METRICS: LeaderboardMetric[] = ["best_score", "wins"];
const PERIODS: LeaderboardPeriod[] = ["all", "weekly"];
const DIFFICULTIES: AIDifficulty[] = ["easy", "normal", "hard"];
const STAR_COUNTS = new Set([30, 40, 50]);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("mode") as LeaderboardMode | null;
  const metric = searchParams.get("metric") as LeaderboardMetric | null;
  const period = searchParams.get("period") as LeaderboardPeriod | null;
  const difficulty = searchParams.get("difficulty") as AIDifficulty | null;
  const starCountRaw = searchParams.get("starCount");
  const starCount = starCountRaw ? Number.parseInt(starCountRaw, 10) : NaN;

  if (!mode || !MODES.includes(mode)) {
    return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
  }
  if (!metric || !METRICS.includes(metric)) {
    return NextResponse.json({ error: "invalid_metric" }, { status: 400 });
  }
  if (!period || !PERIODS.includes(period)) {
    return NextResponse.json({ error: "invalid_period" }, { status: 400 });
  }
  if (!STAR_COUNTS.has(starCount)) {
    return NextResponse.json({ error: "invalid_star_count" }, { status: 400 });
  }
  if (difficulty && !DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json({ error: "invalid_difficulty" }, { status: 400 });
  }

  try {
    const rows = queryLeaderboard({
      mode,
      difficulty: difficulty ?? undefined,
      starCount,
      metric,
      period,
    });
    return NextResponse.json({ rows });
  } catch (error) {
    console.error("leaderboard query failed", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }
}
