import { and, desc, eq, gte, sql } from "drizzle-orm";

import type { AIDifficulty } from "../../game/state";
import { db } from "./client";
import { gameResults, games, players } from "./schema";

export type LeaderboardMode = "pvp" | "ai";
export type LeaderboardMetric = "best_score" | "wins";
export type LeaderboardPeriod = "all" | "weekly";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface RecordResultInput {
  gameId: string;
  finishedAt: number;
  starCount: number;
  entries: Array<{
    playerId: string;
    nickname: string;
    score: number;
    rank: number;
    isAi: boolean;
    aiDifficulty?: AIDifficulty;
  }>;
}

export function recordGameResult(input: RecordResultInput) {
  const humanEntries = input.entries.filter((e) => !e.isAi);
  const aiEntries = input.entries.filter((e) => e.isAi);

  if (humanEntries.length === 0) return;

  const hasAi = aiEntries.length > 0;
  const maxAiDifficulty = hasAi ? resolveMaxDifficulty(aiEntries) : null;

  db.transaction((tx) => {
    tx.insert(games)
      .values({
        id: input.gameId,
        finishedAt: input.finishedAt,
        starCount: input.starCount,
        playerCount: input.entries.length,
        hasAi: hasAi ? 1 : 0,
        maxAiDifficulty,
      })
      .run();

    for (const entry of input.entries) {
      tx.insert(gameResults)
        .values({
          gameId: input.gameId,
          playerId: entry.playerId,
          nicknameSnapshot: entry.nickname,
          score: entry.score,
          rank: entry.rank,
          isAi: entry.isAi ? 1 : 0,
          aiDifficulty: entry.aiDifficulty ?? null,
        })
        .run();
    }

    for (const entry of humanEntries) {
      tx.insert(players)
        .values({
          id: entry.playerId,
          nickname: entry.nickname,
          createdAt: input.finishedAt,
          lastSeenAt: input.finishedAt,
        })
        .onConflictDoUpdate({
          target: players.id,
          set: {
            nickname: entry.nickname,
            lastSeenAt: input.finishedAt,
          },
        })
        .run();
    }
  });
}

function resolveMaxDifficulty(
  aiEntries: Array<{ aiDifficulty?: AIDifficulty }>
): AIDifficulty {
  const order: AIDifficulty[] = ["easy", "normal", "hard"];
  let best: AIDifficulty = "easy";
  for (const entry of aiEntries) {
    const d = entry.aiDifficulty ?? "easy";
    if (order.indexOf(d) > order.indexOf(best)) best = d;
  }
  return best;
}

export interface LeaderboardQuery {
  mode: LeaderboardMode;
  difficulty?: AIDifficulty;
  starCount: number;
  metric: LeaderboardMetric;
  period: LeaderboardPeriod;
  limit?: number;
}

export interface LeaderboardRow {
  playerId: string;
  nickname: string;
  value: number;
  rank: number;
}

export function queryLeaderboard(q: LeaderboardQuery): LeaderboardRow[] {
  const limit = q.limit ?? 100;

  const gameFilters = [eq(games.starCount, q.starCount)];
  if (q.mode === "pvp") {
    gameFilters.push(eq(games.hasAi, 0));
  } else {
    gameFilters.push(eq(games.hasAi, 1));
    if (q.difficulty) {
      gameFilters.push(eq(games.maxAiDifficulty, q.difficulty));
    }
  }
  if (q.period === "weekly") {
    gameFilters.push(gte(games.finishedAt, Date.now() - WEEK_MS));
  }

  const resultFilters = [eq(gameResults.isAi, 0)];

  if (q.metric === "best_score") {
    const rows = db
      .select({
        playerId: gameResults.playerId,
        nickname: sql<string>`
          (SELECT nickname_snapshot FROM game_results gr2
           WHERE gr2.player_id = ${gameResults.playerId}
           ORDER BY gr2.rowid DESC LIMIT 1)
        `.as("nickname"),
        value: sql<number>`MAX(${gameResults.score})`.as("value"),
      })
      .from(gameResults)
      .innerJoin(games, eq(games.id, gameResults.gameId))
      .where(and(...gameFilters, ...resultFilters))
      .groupBy(gameResults.playerId)
      .orderBy(desc(sql`value`))
      .limit(limit)
      .all();

    return rows.map((row, idx) => ({
      playerId: row.playerId,
      nickname: row.nickname ?? row.playerId,
      value: row.value,
      rank: idx + 1,
    }));
  }

  const rows = db
    .select({
      playerId: gameResults.playerId,
      nickname: sql<string>`
        (SELECT nickname_snapshot FROM game_results gr2
         WHERE gr2.player_id = ${gameResults.playerId}
         ORDER BY gr2.rowid DESC LIMIT 1)
      `.as("nickname"),
      value: sql<number>`SUM(CASE WHEN ${gameResults.rank} = 1 THEN 1 ELSE 0 END)`.as(
        "value"
      ),
    })
    .from(gameResults)
    .innerJoin(games, eq(games.id, gameResults.gameId))
    .where(and(...gameFilters, ...resultFilters))
    .groupBy(gameResults.playerId)
    .having(sql`value > 0`)
    .orderBy(desc(sql`value`))
    .limit(limit)
    .all();

  return rows.map((row, idx) => ({
    playerId: row.playerId,
    nickname: row.nickname ?? row.playerId,
    value: row.value,
    rank: idx + 1,
  }));
}

export interface PersonalRecordQuery {
  playerId: string;
  mode: LeaderboardMode;
  difficulty?: AIDifficulty;
  starCount: number;
}

export interface PersonalRecord {
  bestScore: number;
  wins: number;
  games: number;
}

export function queryPersonalRecord(q: PersonalRecordQuery): PersonalRecord {
  const gameFilters = [eq(games.starCount, q.starCount)];
  if (q.mode === "pvp") {
    gameFilters.push(eq(games.hasAi, 0));
  } else {
    gameFilters.push(eq(games.hasAi, 1));
    if (q.difficulty) {
      gameFilters.push(eq(games.maxAiDifficulty, q.difficulty));
    } else {
      gameFilters.push(sql`${games.maxAiDifficulty} IS NOT NULL`);
    }
  }

  const [row] = db
    .select({
      bestScore: sql<number>`COALESCE(MAX(${gameResults.score}), 0)`,
      wins: sql<number>`SUM(CASE WHEN ${gameResults.rank} = 1 THEN 1 ELSE 0 END)`,
      games: sql<number>`COUNT(*)`,
    })
    .from(gameResults)
    .innerJoin(games, eq(games.id, gameResults.gameId))
    .where(
      and(
        eq(gameResults.playerId, q.playerId),
        eq(gameResults.isAi, 0),
        ...gameFilters
      )
    )
    .all();

  return {
    bestScore: row?.bestScore ?? 0,
    wins: row?.wins ?? 0,
    games: row?.games ?? 0,
  };
}

