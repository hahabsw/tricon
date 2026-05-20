"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "../../../src/client/store/gameStore";
import { joinRoomById, getCurrentRoom, cancelPendingLeave, leaveRoomDeferred, reconnectRoom } from "../../../src/client/network/client";
import { WaitingRoom } from "../../../components/WaitingRoom";
import { Scoreboard } from "../../../components/Scoreboard";
import { TurnIndicator } from "../../../components/TurnIndicator";
import { ResultScreen } from "../../../components/ResultScreen";
import { GameBoard } from "../../../src/client/renderer/GameBoard";
import { GlassBeam, HoverShimmer, HUDFrame } from "../../../components/fx/Animations";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { phase } = useGameStore();
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    cancelPendingLeave();

    const init = async () => {
      if (getCurrentRoom()) return;
      if (initRef.current) return;
      initRef.current = true;
      try {
        await reconnectRoom(roomId);
      } catch {
        try {
          await joinRoomById(roomId);
        } catch {
          if (mounted) setError("Room not found or disconnected.");
        }
      }
    };

    init();

    return () => {
      mounted = false;
      initRef.current = false;
      // Give users a short grace period for quick back/forward navigation.
      leaveRoomDeferred(10000);
    };
  }, [roomId]);

  useEffect(() => {
    document.body.classList.add("game-lock");
    return () => {
      document.body.classList.remove("game-lock");
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh text-white px-4 text-center">
        <div className="glass relative overflow-hidden rounded-3xl border border-rose-500/30 px-8 py-12 sm:px-12 sm:py-16 max-w-md w-full shadow-[0_0_80px_rgba(244,63,94,0.2)]">
          <GlassBeam />
          <HUDFrame color="rgba(251,113,133,0.55)" />
          <h1 className="text-3xl sm:text-4xl font-black text-rose-400 tracking-tighter drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]">
            CONNECTION FAILED
          </h1>
          <p className="mt-6 text-white/60 uppercase tracking-widest text-xs sm:text-sm">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="relative overflow-hidden mt-10 px-8 py-4 bg-white/10 hover:bg-white/20 transition-all rounded-lg font-bold border border-white/20 uppercase tracking-widest text-sm"
          >
            <span className="relative z-10">Return to Menu</span>
            <HoverShimmer />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-dvh overflow-hidden select-none">
      {phase === "waiting" && <WaitingRoom />}

      {(phase === "playing" || phase === "paused" || phase === "finished") && (
        <>
          <Scoreboard />

          <div className="absolute inset-0 p-2 pt-20 pb-28 sm:p-8 sm:pt-32 sm:pb-48 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto w-full h-full flex items-center justify-center">
              <GameBoard />
            </div>
          </div>

          {phase === "playing" && <TurnIndicator />}
        </>
      )}

      {phase === "paused" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="glass relative overflow-hidden w-full max-w-lg rounded-2xl sm:rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl text-center">
            <GlassBeam />
            <HUDFrame />
            <div className="text-xs uppercase tracking-[0.3em] text-white/50 font-bold mb-3">
              Standby
            </div>
            <div className="text-xl sm:text-2xl font-black tracking-tight">
              플레이할 상대가 없습니다
            </div>
            <div className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
              상대가 다시 접속하면 게임이 자동으로 재개됩니다.
            </div>
            <button
              onClick={() => router.push("/")}
              className="relative overflow-hidden mt-8 w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 transition-all rounded-lg font-bold border border-white/20 uppercase tracking-widest text-xs sm:text-sm"
            >
              <span className="relative z-10">Return to Menu</span>
              <HoverShimmer />
            </button>
          </div>
        </div>
      )}

      {phase === "finished" && <ResultScreen />}
    </div>
  );
}
