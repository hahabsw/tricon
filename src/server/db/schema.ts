import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  nickname: text("nickname").notNull(),
  createdAt: integer("created_at").notNull(),
  lastSeenAt: integer("last_seen_at").notNull(),
});

export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  finishedAt: integer("finished_at").notNull(),
  starCount: integer("star_count").notNull(),
  playerCount: integer("player_count").notNull(),
  hasAi: integer("has_ai").notNull(),
  maxAiDifficulty: text("max_ai_difficulty"),
});

export const gameResults = sqliteTable("game_results", {
  gameId: text("game_id")
    .notNull()
    .references(() => games.id),
  playerId: text("player_id").notNull(),
  nicknameSnapshot: text("nickname_snapshot").notNull(),
  score: real("score").notNull(),
  rank: integer("rank").notNull(),
  isAi: integer("is_ai").notNull(),
  aiDifficulty: text("ai_difficulty"),
});

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type GameResult = typeof gameResults.$inferSelect;
export type NewGameResult = typeof gameResults.$inferInsert;
