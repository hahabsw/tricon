"use client";

import { useGameStore } from "../src/client/store/gameStore";
import { sendReady } from "../src/client/network/client";
import { PLAYER_COLORS } from "../src/game/state";

export const WaitingRoom = () => {
  const { players, roomId, myPlayerId, settings, turnOrder } = useGameStore();

  const handleReady = () => {
    sendReady();
  };

  const myPlayer = players[myPlayerId];
  const isReady = myPlayer?.ready;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050510] relative z-50">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none mix-blend-screen" />
      <div className="glass p-12 rounded-3xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,1)] w-full max-w-3xl relative overflow-hidden">
        
        <div className="absolute top-10 right-10 flex flex-col items-end">
          <span className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold mb-2">Room Code</span>
          <div className="bg-black/50 px-6 py-3 rounded-lg border border-cyan-500/30 text-cyan-400 font-mono text-2xl tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            {roomId}
          </div>
        </div>

        <h2 className="text-5xl font-black mb-12 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 tracking-tight">
          Briefing Room
        </h2>

        <div className="space-y-4 mb-12">
          {Object.values(players).map((p, i) => (
            <div 
              key={p.id}
              className={`flex items-center justify-between p-6 rounded-2xl border transition-all duration-500 ${
                p.ready 
                  ? "bg-emerald-900/20 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]" 
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center space-x-6">
                <div 
                  className="w-4 h-4 rounded-full shadow-[0_0_10px_currentColor]"
                  style={{ color: PLAYER_COLORS[i] || "#ffffff", backgroundColor: PLAYER_COLORS[i] || "#ffffff" }} 
                />
                <div>
                  <div className="text-xl font-bold flex items-center space-x-3">
                    <span>{p.name || `Player ${i + 1}`}</span>
                    {p.id === myPlayerId && <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/70 tracking-widest uppercase">You</span>}
                  </div>
                </div>
              </div>
              
              <div className={`px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase ${
                p.ready ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40"
              }`}>
                {p.ready ? "Ready" : "Standing By"}
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: settings.maxPlayers - Object.keys(players).length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center justify-between p-6 rounded-2xl border border-dashed border-white/10 bg-black/20">
              <div className="text-white/30 italic font-mono tracking-widest">Awaiting Pilot...</div>
            </div>
          ))}
        </div>

        <button
          onClick={handleReady}
          className={`w-full py-6 rounded-2xl font-black text-2xl tracking-widest uppercase transition-all duration-500 ${
            isReady
              ? "bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
              : "bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white shadow-[0_0_40px_rgba(34,211,238,0.4)]"
          }`}
        >
          {isReady ? "Status: Ready" : "Engage"}
        </button>
      </div>
    </div>
  );
};
