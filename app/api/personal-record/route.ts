import { NextRequest, NextResponse } from "next/server";

import {
  LeaderboardMode,
  queryPersonalRecord,
} from "../../../src/server/db/leaderboard";
import type { AIDifficulty } from "../../../src/game/state";

const MODES: LeaderboardMode[] = ["pvp", "ai"];
const DIFFICULTIES: AIDifficulty[] = ["easy", "normal", "hard"];
const STAR_COUNTS = new Set([30, 40, 50]);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const playerId = searchParams.get("playerId")?.trim() ?? "";
  const mode = searchParams.get("mode") as LeaderboardMode | null;
  const difficulty = searchParams.get("difficulty") as AIDifficulty | null;
  const starCountRaw = searchParams.get("starCount");
  const starCount = starCountRaw ? Number.parseInt(starCountRaw, 10) : NaN;

  if (!playerId) {
    return NextResponse.json({ error: "missing_player_id" }, { status: 400 });
  }
  if (!mode || !MODES.includes(mode)) {
    return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
  }
  if (!STAR_COUNTS.has(starCount)) {
    return NextResponse.json({ error: "invalid_star_count" }, { status: 400 });
  }
  if (difficulty && !DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json({ error: "invalid_difficulty" }, { status: 400 });
  }

  try {
    const record = queryPersonalRecord({
      playerId,
      mode,
      difficulty: difficulty ?? undefined,
      starCount,
    });
    return NextResponse.json({ record });
  } catch (error) {
    console.error("personal record query failed", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }
}
