"use client";

import { useGameStore } from "../src/client/store/gameStore";
import { sendPass } from "../src/client/network/client";
import { PLAYER_COLORS } from "../src/game/state";

export const TurnIndicator = () => {
  const { 
    myPlayerId, 
    currentTurnPlayerId, 
    turnTimeLeft, 
    players, 
    turnOrder,
    settings
  } = useGameStore();

  const isMyTurn = myPlayerId === currentTurnPlayerId;
  const turnIdx = turnOrder.indexOf(currentTurnPlayerId);
  const turnColor = PLAYER_COLORS[turnIdx] || "#ffffff";
  const player = players[currentTurnPlayerId];

  // Calculate progress
  const progress = (turnTimeLeft / settings.turnTimeSeconds) * 100;
  const isUrgent = turnTimeLeft <= 10;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-auto">
      <div 
        className="glass rounded-3xl border shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
        style={{ borderColor: `${turnColor}40` }}
      >
        <div className="flex items-center justify-between px-10 py-6 min-w-[400px]">
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-[0.3em] text-white/50 mb-1">
              {isMyTurn ? "Your Sequence" : "Enemy Sequence"}
            </span>
            <span 
              className="text-3xl font-black tracking-tight drop-shadow-lg"
              style={{ color: turnColor }}
            >
              {isMyTurn ? "Action Required" : `${player?.name || "Player"}'s Turn`}
            </span>
          </div>

          <div className="flex items-center justify-center bg-black/50 rounded-full w-20 h-20 border border-white/10 relative">
            <span className={`text-4xl font-black font-mono tracking-tighter tabular-nums ${isUrgent ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {turnTimeLeft}
            </span>
            {/* Circular progress SVG */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="38"
                stroke={turnColor}
                strokeWidth="4"
                fill="none"
                strokeDasharray="238.7" /* 2 * PI * r */
                strokeDashoffset={238.7 - (238.7 * progress) / 100}
                className="transition-all duration-1000 ease-linear"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>

        {isMyTurn && (
          <div className="bg-black/40 border-t border-white/5 p-4 flex justify-center">
            <button
              onClick={() => sendPass()}
              className="px-12 py-3 rounded-full uppercase tracking-widest text-sm font-bold bg-white/5 hover:bg-white/10 hover:text-white transition-all text-white/60 border border-white/10 hover:border-white/30"
            >
              Skip Sequence
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
