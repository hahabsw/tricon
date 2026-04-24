"use client";
import { Lobby } from "../../components/Lobby";

export default function LobbyPage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh text-white p-4 sm:p-6 overflow-hidden">
      <div className="relative z-10 w-full flex justify-center">
        <Lobby />
      </div>
    </div>
  );
}
