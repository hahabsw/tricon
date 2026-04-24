"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRoom, leaveRoom } from "../src/client/network/client";
import { AIDifficulty, GameSettings } from "../src/game/state";

export const Lobby = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState<Partial<GameSettings>>({
    maxPlayers: 2,
    starCount: 40,
    turnTimeSeconds: 20,
  });
  const [aiPlayers, setAIPlayers] = useState(0);
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>("easy");
  const [isPrivate, setIsPrivate] = useState(false);
  const maxAI = (settings.maxPlayers ?? 2) - 1;

  const handleCreate = async () => {
    setLoading(true);
    try {
      leaveRoom();
      const aiPlayerOptions =
        aiPlayers > 0
          ? Array.from({ length: aiPlayers }, () => ({ difficulty: aiDifficulty }))
          : 0;
      const room = await createRoom("game_room", {
        settings: { ...settings, aiPlayers: aiPlayerOptions, isPrivate },
      });
      router.push(`/game/${room.roomId}`);
    } catch {
      alert("Failed to create room.");
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6 sm:p-10 md:p-12 rounded-2xl sm:rounded-3xl w-full max-w-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

      <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
        Room Settings
      </h1>

      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4">
          <label className="text-xs sm:text-sm uppercase tracking-widest text-white/50 font-bold">Player Count</label>
          <div className="flex gap-2 sm:gap-4">
            {[2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => {
                  setSettings({ ...settings, maxPlayers: num as 2|3|4 });
                  setAIPlayers(prev => Math.min(prev, num - 1));
                }}
                className={`flex-1 py-3 sm:py-4 rounded-lg sm:rounded-xl border transition-all text-sm sm:text-base ${
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

        <div className="space-y-3 sm:space-y-4">
          <label className="text-xs sm:text-sm uppercase tracking-widest text-white/50 font-bold">Star Count</label>
          <div className="flex gap-2 sm:gap-4">
            {[30, 40, 50].map(num => (
              <button
                key={num}
                onClick={() => setSettings({ ...settings, starCount: num as 30|40|50 })}
                className={`flex-1 py-3 sm:py-4 rounded-lg sm:rounded-xl border transition-all text-sm sm:text-base ${
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

        <div className="space-y-3 sm:space-y-4">
          <label className="text-xs sm:text-sm uppercase tracking-widest text-white/50 font-bold">Turn Timer</label>
          <div className="flex gap-2 sm:gap-4">
            {[10, 20, 30].map(num => (
              <button
                key={num}
                onClick={() => setSettings({ ...settings, turnTimeSeconds: num as 10|20|30 })}
                className={`flex-1 py-3 sm:py-4 rounded-lg sm:rounded-xl border transition-all text-sm sm:text-base ${
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

        <div className="space-y-3 sm:space-y-4">
          <label className="text-xs sm:text-sm uppercase tracking-widest text-white/50 font-bold">AI Opponents</label>
          <div className="flex gap-2 sm:gap-4 flex-wrap">
            {Array.from({ length: maxAI + 1 }, (_, i) => i).map(num => (
              <button
                key={num}
                onClick={() => setAIPlayers(num)}
                className={`flex-1 min-w-[70px] py-3 sm:py-4 rounded-lg sm:rounded-xl border transition-all text-sm sm:text-base ${
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

        {aiPlayers > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <label className="text-xs sm:text-sm uppercase tracking-widest text-white/50 font-bold">AI Difficulty</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {(["easy", "normal", "hard"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setAIDifficulty(level)}
                  className={`py-3 sm:py-4 rounded-lg sm:rounded-xl border transition-all text-sm sm:text-base capitalize ${
                    aiDifficulty === level
                      ? "bg-rose-500/20 border-rose-400 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      : "bg-black/40 border-white/10 text-white/70 hover:border-white/30"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          <label className="text-xs sm:text-sm uppercase tracking-widest text-white/50 font-bold">Visibility</label>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <button
              onClick={() => setIsPrivate(false)}
              className={`py-3 sm:py-4 rounded-lg sm:rounded-xl border transition-all text-sm sm:text-base ${
                !isPrivate
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                  : "bg-black/40 border-white/10 text-white/70 hover:border-white/30"
              }`}
            >
              Public
            </button>
            <button
              onClick={() => setIsPrivate(true)}
              className={`py-3 sm:py-4 rounded-lg sm:rounded-xl border transition-all text-sm sm:text-base ${
                isPrivate
                  ? "bg-rose-500/20 border-rose-400 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  : "bg-black/40 border-white/10 text-white/70 hover:border-white/30"
              }`}
            >
              Private
            </button>
          </div>
          <p className="text-xs text-white/50">
            Public rooms appear in the briefing room list. Private rooms can only be joined with the room code.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mt-12 flex gap-2 sm:gap-4">
        <button
          onClick={() => router.back()}
          className="px-5 sm:px-8 py-3 sm:py-4 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl font-bold transition-all border border-white/10 text-sm sm:text-base"
        >
          Back
        </button>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 rounded-lg sm:rounded-xl font-bold shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all text-sm sm:text-base"
        >
          {loading ? "Creating..." : "Launch Room"}
        </button>
      </div>
    </div>
  );
};
