"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { joinRoomById } from "../src/client/network/client";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    router.push("/lobby");
  };

  const handleJoin = async () => {
    if (!joinCode) return;
    setLoading(true);
    try {
      const room = await joinRoomById(joinCode);
      router.push(`/game/${room.roomId}`);
    } catch (e) {
      alert("Failed to join room.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050510] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 flex flex-col items-center space-y-8 glass p-12 rounded-2xl border border-white/10 shadow-2xl">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 tracking-tighter drop-shadow-sm">
          Stellar Conquest
        </h1>
        
        <div className="w-full flex flex-col space-y-4">
          <button 
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-lg font-bold text-lg border border-white/20 hover:border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            Create New Room
          </button>
          
          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              placeholder="Room Code" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-4 outline-none focus:border-cyan-400 transition-colors uppercase text-center tracking-widest font-mono"
            />
            <button 
              onClick={handleJoin}
              disabled={loading || !joinCode}
              className="py-4 px-8 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 transition-all rounded-lg font-bold border border-cyan-500/50"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
