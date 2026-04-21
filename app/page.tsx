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
    <div className="relative h-screen w-full overflow-y-auto overflow-x-hidden bg-space-900">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-10">
        <div className="flex w-full flex-col items-center space-y-6 glass p-6 sm:p-8 md:p-12 rounded-2xl border border-white/10 shadow-2xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-fuchsia-400 tracking-tighter drop-shadow-sm text-center">
          Tricon
        </h1>
        
        <div className="w-full flex flex-col space-y-4">
          <button 
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-lg font-bold text-base sm:text-lg border border-white/20 hover:border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            Create New Room
          </button>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
              className="py-4 px-8 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 transition-all rounded-lg font-bold border border-cyan-500/50 w-full sm:w-auto"
            >
              Join
            </button>
          </div>
        </div>

        <div className="w-full rounded-xl border border-white/10 bg-black/20 p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
            게임 플레이 방법
          </h2>
          <ul className="mt-3 space-y-2 text-sm sm:text-base text-white/80 leading-relaxed">
            <li>
              내 턴에 <span className="text-white font-semibold">별 2개를 선택</span>해서 선 1개를 그립니다.
            </li>
            <li>
              선은 <span className="text-white font-semibold">공용</span>이라서, 누구나 기존 선을 활용할 수 있어요.
            </li>
            <li>
              내가 그은 선으로 <span className="text-white font-semibold">삼각형의 마지막 변</span>이 완성되면 그 삼각형을 소유합니다.
            </li>
            <li>
              삼각형을 완성하면 <span className="text-white font-semibold">보너스 턴 1회</span>를 얻습니다. (연쇄 가능)
            </li>
            <li>
              교차하는 선은 그을 수 없고, 같은 별 쌍은 중복 연결할 수 없어요.
            </li>
          </ul>
        </div>
        </div>
      </div>
    </div>
  );
}
