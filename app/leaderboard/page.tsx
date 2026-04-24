"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getPlayerId } from "../../src/client/identity";
import type { AIDifficulty } from "../../src/game/state";

type Mode = "pvp" | "easy" | "normal" | "hard";
type Metric = "best_score" | "wins";
type Period = "all" | "weekly";
type StarCount = 30 | 40 | 50;

interface LeaderboardRow {
  playerId: string;
  nickname: string;
  value: number;
  rank: number;
}

const MODE_TABS: Array<{ key: Mode; label: string }> = [
  { key: "pvp", label: "PvP" },
  { key: "easy", label: "vs Easy" },
  { key: "normal", label: "vs Normal" },
  { key: "hard", label: "vs Hard" },
];

const STAR_TABS: StarCount[] = [30, 40, 50];

function buildQuery(
  mode: Mode,
  metric: Metric,
  period: Period,
  starCount: StarCount
): string {
  const params = new URLSearchParams();
  if (mode === "pvp") {
    params.set("mode", "pvp");
  } else {
    params.set("mode", "ai");
    params.set("difficulty", mode satisfies AIDifficulty);
  }
  params.set("metric", metric);
  params.set("period", period);
  params.set("starCount", String(starCount));
  return params.toString();
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("pvp");
  const [starCount, setStarCount] = useState<StarCount>(40);
  const [metric, setMetric] = useState<Metric>("best_score");
  const [period, setPeriod] = useState<Period>("all");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [myId, setMyId] = useState("");

  useEffect(() => {
    setMyId(getPlayerId());
  }, []);

  const queryString = useMemo(
    () => buildQuery(mode, metric, period, starCount),
    [mode, metric, period, starCount]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/leaderboard?${queryString}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setRows(Array.isArray(data.rows) ? data.rows : []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const formatValue = (value: number): string => {
    if (metric === "wins") return `${value}`;
    return value.toFixed(3);
  };

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#050510] text-white">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-white/60 hover:text-white transition-colors uppercase tracking-widest"
          >
            ← Menu
          </button>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-rose-400">
            Leaderboard
          </h1>
          <div className="w-12" />
        </div>

        <div className="glass rounded-2xl border border-white/10 p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-4 gap-2">
            {MODE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                className={`py-2 sm:py-3 rounded-lg border text-xs sm:text-sm font-bold transition-all ${
                  mode === tab.key
                    ? "bg-rose-500/20 border-rose-400 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                    : "bg-black/40 border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {STAR_TABS.map((n) => (
              <button
                key={n}
                onClick={() => setStarCount(n)}
                className={`flex-1 min-w-[60px] py-2 rounded-lg border text-xs sm:text-sm font-bold transition-all ${
                  starCount === n
                    ? "bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-200"
                    : "bg-black/40 border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                ★ {n}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] grid grid-cols-2 gap-2">
              {(["best_score", "wins"] as Metric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`py-2 rounded-lg border text-xs sm:text-sm font-bold transition-all ${
                    metric === m
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                      : "bg-black/40 border-white/10 text-white/60 hover:border-white/30"
                  }`}
                >
                  {m === "best_score" ? "Best Score" : "Wins"}
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-[200px] grid grid-cols-2 gap-2">
              {(["all", "weekly"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`py-2 rounded-lg border text-xs sm:text-sm font-bold transition-all ${
                    period === p
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                      : "bg-black/40 border-white/10 text-white/60 hover:border-white/30"
                  }`}
                >
                  {p === "all" ? "All-time" : "Weekly"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 rounded-xl border border-white/10 bg-black/30 overflow-hidden">
            <div className="grid grid-cols-[48px_1fr_auto] gap-4 px-4 py-3 text-xs uppercase tracking-widest text-white/40 border-b border-white/10">
              <div>#</div>
              <div>Player</div>
              <div className="text-right">
                {metric === "best_score" ? "Best Area" : "Wins"}
              </div>
            </div>

            {loading ? (
              <div className="py-10 text-center text-white/40 text-sm">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="py-10 text-center text-white/40 text-sm">
                아직 기록이 없습니다.
              </div>
            ) : (
              rows.map((row) => {
                const isMe = row.playerId === myId;
                return (
                  <div
                    key={`${row.playerId}-${row.rank}`}
                    className={`grid grid-cols-[48px_1fr_auto] gap-4 px-4 py-3 items-center border-b border-white/5 last:border-b-0 text-sm ${
                      isMe ? "bg-amber-500/10 text-amber-200" : ""
                    }`}
                  >
                    <div className="font-mono font-bold">
                      {row.rank <= 3 ? (
                        <span
                          className={
                            row.rank === 1
                              ? "text-amber-300"
                              : row.rank === 2
                                ? "text-slate-300"
                                : "text-orange-400"
                          }
                        >
                          {row.rank}
                        </span>
                      ) : (
                        <span className="text-white/50">{row.rank}</span>
                      )}
                    </div>
                    <div className="truncate font-medium">
                      {row.nickname || "—"}
                      {isMe && <span className="ml-2 text-xs text-amber-300/70">(you)</span>}
                    </div>
                    <div className="font-mono tabular-nums text-white/80 text-right">
                      {formatValue(row.value)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
