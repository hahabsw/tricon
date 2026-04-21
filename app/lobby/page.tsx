"use client";
import { Lobby } from "../../components/Lobby";

export default function LobbyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-[#050510] text-white p-4 sm:p-6">
      <Lobby />
    </div>
  );
}
