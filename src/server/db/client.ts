import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import * as schema from "./schema";

const DEFAULT_DB_PATH = resolve(process.cwd(), "data", "tricon.db");

function resolveDbPath(): string {
  const envPath = process.env.TRICON_DB_PATH;
  return envPath && envPath.length > 0 ? envPath : DEFAULT_DB_PATH;
}

function ensureDirectory(filePath: string) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

const DB_PATH = resolveDbPath();
ensureDirectory(DB_PATH);

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });
export const rawDb = sqlite;
export { schema };

let initialized = false;

export function ensureSchema() {
  if (initialized) return;
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      finished_at INTEGER NOT NULL,
      star_count INTEGER NOT NULL,
      player_count INTEGER NOT NULL,
      has_ai INTEGER NOT NULL,
      max_ai_difficulty TEXT
    );

    CREATE TABLE IF NOT EXISTS game_results (
      game_id TEXT NOT NULL REFERENCES games(id),
      player_id TEXT NOT NULL,
      nickname_snapshot TEXT NOT NULL,
      score REAL NOT NULL,
      rank INTEGER NOT NULL,
      is_ai INTEGER NOT NULL,
      ai_difficulty TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_results_player ON game_results(player_id);
    CREATE INDEX IF NOT EXISTS idx_results_game ON game_results(game_id);
    CREATE INDEX IF NOT EXISTS idx_games_finished ON games(finished_at);
    CREATE INDEX IF NOT EXISTS idx_games_filter
      ON games(has_ai, max_ai_difficulty, star_count);
  `);
  initialized = true;
}

ensureSchema();
