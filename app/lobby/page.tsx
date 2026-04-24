"use client";
import { AnimatedBackground } from "../../components/AnimatedBackground";
import { Lobby } from "../../components/Lobby";

export default function LobbyPage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh bg-[#050510] text-white p-4 sm:p-6 overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 w-full flex justify-center">
        <Lobby />
      </div>
    </div>
  );
}
