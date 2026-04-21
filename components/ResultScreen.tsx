"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "../src/client/store/gameStore";
import { leaveRoom } from "../src/client/network/client";
import { PLAYER_COLORS } from "../src/game/state";

export const ResultScreen = () => {
  const router = useRouter();
  const { gameResult, players, myPlayerId, resetGame } = useGameStore();

  if (!gameResult) return null;

  const handleLeave = () => {
    // User explicitly leaves the room → disconnect immediately.
    leaveRoom();
    resetGame();
    router.push("/");
  };

  const isWinner = gameResult.winner === myPlayerId;
  const rankings = gameResult.rankings || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#050510]/90 backdrop-blur-2xl">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div className="glass p-6 sm:p-10 md:p-16 rounded-2xl sm:rounded-3xl border border-white/20 shadow-[0_0_100px_rgba(34,211,238,0.2)] max-w-4xl w-full relative overflow-hidden">

          {/* Glow effect based on win/loss */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] pointer-events-none opacity-20 ${
            isWinner ? "bg-emerald-500" : "bg-fuchsia-500"
          }`} />

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/50 mb-3 sm:mb-4 text-center">
              Simulation Complete
            </h2>
            <h1 className={`text-5xl sm:text-6xl md:text-7xl font-black mb-8 sm:mb-16 text-transparent bg-clip-text tracking-tighter drop-shadow-2xl ${
              isWinner
                ? "bg-gradient-to-r from-emerald-300 to-cyan-300"
                : "bg-gradient-to-r from-fuchsia-300 to-rose-300"
            }`}>
              {isWinner ? "VICTORY" : "DEFEAT"}
            </h1>

            <div className="w-full space-y-3 sm:space-y-6 mb-8 sm:mb-16">
              {rankings.map((rank: any, idx: number) => {
                const p = players[rank.playerId];
                const isMe = rank.playerId === myPlayerId;
                const color = PLAYER_COLORS[idx] || "#ffffff";

                return (
                  <div
                    key={rank.playerId}
                    className={`flex items-center justify-between p-3 sm:p-6 rounded-xl sm:rounded-2xl border transition-all ${
                      isMe
                        ? "bg-white/10 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-[1.02] sm:scale-105"
                        : "bg-black/40 border-white/5 opacity-70"
                    }`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-6 min-w-0">
                      <span className="text-2xl sm:text-4xl font-black text-white/20 tabular-nums shrink-0">#{rank.rank}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center space-x-2 sm:space-x-3 flex-wrap">
                          <span className="truncate">{p?.name || "Player"}</span>
                          {isMe && <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 uppercase tracking-widest text-white/90 font-black">You</span>}
                        </span>
                      </div>
                    </div>

                    <div className="text-xl sm:text-3xl font-black tracking-tighter tabular-nums shrink-0 ml-2" style={{ color }}>
                      {(rank.score * 100).toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleLeave}
              className="w-full sm:w-auto px-10 sm:px-16 py-4 sm:py-6 bg-white text-black hover:bg-gray-200 transition-all rounded-full font-black text-base sm:text-xl uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] active:scale-95"
            >
              Return to Base
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
