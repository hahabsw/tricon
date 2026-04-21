"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { joinOrCreateRoom } from "../src/client/network/client";
import { GameSettings } from "../src/game/state";

export const Lobby = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState<Partial<GameSettings>>({
    maxPlayers: 2,
    starCount: 40,
    turnTimeSeconds: 30,
  });
  const [aiPlayers, setAIPlayers] = useState(0);
  const maxAI = (settings.maxPlayers ?? 2) - 1;

  const handleCreate = async () => {
    setLoading(true);
    try {
      const room = await joinOrCreateRoom("game_room", { settings: { ...settings, aiPlayers } });
      router.push(`/game/${room.roomId}`);
    } catch (e) {
      alert("Failed to create room.");
      setLoading(false);
    }
  };

  return (
    <div className="glass p-12 rounded-3xl w-full max-w-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
      
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
        Room Settings
      </h1>

      <div className="space-y-8">
        <div className="space-y-4">
          <label className="text-sm uppercase tracking-widest text-white/50 font-bold">Player Count</label>
          <div className="flex space-x-4">
            {[2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => {
                  setSettings({ ...settings, maxPlayers: num as 2|3|4 });
                  setAIPlayers(prev => Math.min(prev, num - 1));
                }}
                className={`flex-1 py-4 rounded-xl border transition-all ${
                  settings.maxPlayers === num 
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.3)]" 
                    : "bg-black/40 border-white/10 text-white/70 hover:border-white/30"
                }`}
              >
                {num} Players
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm uppercase tracking-widest text-white/50 font-bold">Star Count</label>
          <div className="flex space-x-4">
            {[30, 40, 50].map(num => (
              <button
                key={num}
                onClick={() => setSettings({ ...settings, starCount: num as 30|40|50 })}
                className={`flex-1 py-4 rounded-xl border transition-all ${
                  settings.starCount === num 
                    ? "bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-200 shadow-[0_0_15px_rgba(232,121,249,0.3)]" 
                    : "bg-black/40 border-white/10 text-white/70 hover:border-white/30"
                }`}
              >
                {num} Stars
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm uppercase tracking-widest text-white/50 font-bold">Turn Timer</label>
          <div className="flex space-x-4">
            {[15, 30, 60].map(num => (
              <button
                key={num}
                onClick={() => setSettings({ ...settings, turnTimeSeconds: num as 15|30|60 })}
                className={`flex-1 py-4 rounded-xl border transition-all ${
                  settings.turnTimeSeconds === num 
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.3)]" 
                    : "bg-black/40 border-white/10 text-white/70 hover:border-white/30"
                }`}
              >
                {num}s
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm uppercase tracking-widest text-white/50 font-bold">AI Opponents</label>
          <div className="flex space-x-4">
            {Array.from({ length: maxAI + 1 }, (_, i) => i).map(num => (
              <button
                key={num}
                onClick={() => setAIPlayers(num)}
                className={`flex-1 py-4 rounded-xl border transition-all ${
                  aiPlayers === num
                    ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "bg-black/40 border-white/10 text-white/70 hover:border-white/30"
                }`}
              >
                {num === 0 ? "None" : `${num} AI`}
              </button>
            ))}
          </div>
          {aiPlayers > 0 && (
            <p className="text-xs text-amber-400/60">
              {aiPlayers} AI + {(settings.maxPlayers ?? 2) - aiPlayers} human slot{(settings.maxPlayers ?? 2) - aiPlayers !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mt-12 flex space-x-4">
        <button
          onClick={() => router.back()}
          className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all border border-white/10"
        >
          Back
        </button>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex-1 py-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 rounded-xl font-bold shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all"
        >
          {loading ? "Creating..." : "Launch Room"}
        </button>
      </div>
    </div>
  );
};
