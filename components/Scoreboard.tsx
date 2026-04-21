"use client";

import { useGameStore } from "../src/client/store/gameStore";
import { PLAYER_COLORS } from "../src/game/state";

export const Scoreboard = () => {
  const { players, turnOrder, currentTurnPlayerId } = useGameStore();

  return (
    <div className="absolute top-2 sm:top-6 left-0 right-0 z-10 flex justify-center pointer-events-none px-2">
      <div className="glass px-3 py-2 sm:px-8 sm:py-4 rounded-full flex items-center space-x-4 sm:space-x-12 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-black/40 backdrop-blur-xl max-w-full overflow-hidden">
        {turnOrder.map((pid, idx) => {
          const player = players[pid];
          const color = PLAYER_COLORS[idx] || "#ffffff";
          const isActive = pid === currentTurnPlayerId;
          const score = player?.score || 0;

          return (
            <div
              key={pid}
              className={`flex items-center space-x-2 sm:space-x-4 transition-all duration-300 min-w-0 ${
                isActive ? "scale-105 sm:scale-110 opacity-100" : "scale-100 opacity-50 grayscale hover:grayscale-0"
              }`}
            >
              <div
                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0"
                style={{
                  backgroundColor: color,
                  boxShadow: isActive ? `0 0 15px ${color}, 0 0 30px ${color}` : 'none'
                }}
              />
              <div className="flex flex-col min-w-0">
                <span className="hidden sm:inline text-xs uppercase font-bold tracking-widest text-white/70 truncate">
                  {player?.name || `Player ${idx + 1}`}
                </span>
                <span
                  className="text-base sm:text-2xl font-black tabular-nums tracking-tighter"
                  style={{ color: isActive ? color : 'white' }}
                >
                  {(score * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
