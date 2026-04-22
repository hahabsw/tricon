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
      <div className="flex flex-col items-center justify-center min-h-dvh bg-[#050510] text-white space-y-8 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-rose-500 tracking-tighter drop-shadow-lg">CONNECTION FAILED</h1>
        <p className="text-white/50 uppercase tracking-widest text-sm">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-8 py-4 bg-white/10 hover:bg-white/20 transition-all rounded-lg font-bold border border-white/20 uppercase tracking-widest text-sm"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-dvh bg-[#050510] overflow-hidden select-none">
      {/* Global space overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

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
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <div className="glass w-full max-w-lg rounded-2xl border border-white/10 p-6 sm:p-8 shadow-2xl text-center">
            <div className="text-xl sm:text-2xl font-black tracking-tight">
              플레이할 상대가 없습니다
            </div>
            <div className="mt-2 text-sm sm:text-base text-white/70 leading-relaxed">
              상대가 다시 접속하면 게임이 자동으로 재개됩니다.
            </div>
            <button
              onClick={() => router.push("/")}
              className="mt-6 w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 transition-all rounded-lg font-bold border border-white/20 uppercase tracking-widest text-xs sm:text-sm"
            >
              Return to Menu
            </button>
          </div>
        </div>
      )}

      {phase === "finished" && <ResultScreen />}
    </div>
  );
}
