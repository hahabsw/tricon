"use client";

import { useGameStore } from "../src/client/store/gameStore";
import { sendReady } from "../src/client/network/client";
import { PLAYER_COLORS } from "../src/game/state";

export const WaitingRoom = () => {
  const { players, roomId, myPlayerId, settings, isPrivateRoom } = useGameStore();

  const handleReady = () => {
    sendReady();
  };

  const myPlayer = players[myPlayerId];
  const isReady = myPlayer?.ready;

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-[#050510]">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none mix-blend-screen" />
      <div className="relative min-h-full flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="glass p-5 sm:p-10 md:p-12 rounded-2xl sm:rounded-3xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,1)] w-full max-w-3xl relative overflow-hidden">

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-12">
            <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 tracking-tight shrink-0">
              Briefing Room
            </h2>
            <div className="flex flex-col items-start sm:items-end w-full sm:w-auto min-w-0">
              <span className={`mb-2 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                isPrivateRoom
                  ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                  : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              }`}>
                {isPrivateRoom ? "Private Room" : "Public Room"}
              </span>
              <span className="text-white/40 uppercase tracking-[0.2em] text-[10px] sm:text-xs font-bold mb-1 sm:mb-2">Room Code</span>
              <div className="w-full sm:w-auto bg-black/50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-cyan-500/30 text-cyan-400 font-mono text-lg sm:text-2xl tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.2)] break-all text-center sm:text-right">
                {roomId}
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-12">
            {Object.values(players).map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-500 ${
                  p.ready
                    ? "bg-emerald-900/20 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center space-x-3 sm:space-x-6 min-w-0">
                  <div
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-[0_0_10px_currentColor] shrink-0"
                    style={{ color: PLAYER_COLORS[i] || "#ffffff", backgroundColor: PLAYER_COLORS[i] || "#ffffff" }}
                  />
                  <div className="min-w-0">
                    <div className="text-base sm:text-xl font-bold flex items-center space-x-2 sm:space-x-3 flex-wrap">
                      <span className="truncate">{p.name || `Player ${i + 1}`}</span>
                      {p.id === myPlayerId && <span className="text-[10px] sm:text-xs bg-white/10 px-2 py-0.5 sm:py-1 rounded text-white/70 tracking-widest uppercase">You</span>}
                    </div>
                  </div>
                </div>

                <div className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-[10px] sm:text-sm font-bold tracking-widest uppercase shrink-0 ml-2 ${
                  p.ready ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40"
                }`}>
                  {p.ready ? "Ready" : "Standing By"}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: settings.maxPlayers - Object.keys(players).length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center justify-between p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-dashed border-white/10 bg-black/20">
                <div className="text-white/30 italic font-mono tracking-widest text-sm sm:text-base">Awaiting Pilot...</div>
              </div>
            ))}
          </div>

          <button
            onClick={handleReady}
            className={`w-full py-4 sm:py-6 rounded-xl sm:rounded-2xl font-black text-lg sm:text-2xl tracking-widest uppercase transition-all duration-500 ${
              isReady
                ? "bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                : "bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white shadow-[0_0_40px_rgba(34,211,238,0.4)]"
            }`}
          >
            {isReady ? "Status: Ready" : "Engage"}
          </button>
        </div>
      </div>
    </div>
  );
};
