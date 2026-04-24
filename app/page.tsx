"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getNickname, setNickname } from "../src/client/identity";
// Network logic is handled by GamePage

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [nickname, setNicknameState] = useState("");

  useEffect(() => {
    setNicknameState(getNickname());
  }, []);

  const handleNicknameChange = (value: string) => {
    const saved = setNickname(value);
    setNicknameState(saved);
  };

  const ensureNickname = () => {
    if (nickname.trim().length === 0) {
      alert("닉네임을 입력해주세요.");
      return false;
    }
    return true;
  };

  const handleCreate = () => {
    if (!ensureNickname()) return;
    router.push("/lobby");
  };

  const handleJoin = async () => {
    if (!joinCode) return;
    if (!ensureNickname()) return;
    setLoading(true);
    router.push(`/game/${joinCode}`);
  };

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-space-900">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-10">
        <div className="flex w-full flex-col items-center space-y-6 glass p-6 sm:p-8 md:p-12 rounded-2xl border border-white/10 shadow-2xl">
        <h1 className="animated-gradient-text text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-emerald-300 to-fuchsia-400 tracking-tighter drop-shadow-sm text-center">
          Tricon
        </h1>

        <a
          href="https://github.com/hahabsw/tricon"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-white/70 hover:text-white transition-colors underline underline-offset-4"
        >
          GitHub
        </a>
        
        <div className="w-full flex flex-col space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-white/50 font-bold px-1">Nickname</label>
            <input
              type="text"
              placeholder="Enter your nickname"
              value={nickname}
              maxLength={16}
              onChange={(e) => handleNicknameChange(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-cyan-400 transition-colors tracking-wide"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-lg font-bold text-base sm:text-lg border border-white/20 hover:border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            Create New Room
          </button>

          <button
            onClick={() => router.push("/briefing-rooms")}
            disabled={loading}
            className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all rounded-lg font-bold text-base sm:text-lg border border-emerald-500/25 hover:border-emerald-400/50 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.12)]"
          >
            Browse Public Briefing Rooms
          </button>

          <button
            onClick={() => router.push("/leaderboard")}
            disabled={loading}
            className="w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 transition-all rounded-lg font-bold text-base sm:text-lg border border-amber-500/25 hover:border-amber-400/50 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.12)]"
          >
            Leaderboard
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
            <li>
              턴을 직접 넘기거나 시간을 초과하면 <span className="text-white font-semibold">가능한 선 중 하나가 랜덤으로 자동 배치</span>됩니다.
            </li>
          </ul>
        </div>
        </div>
      </div>
    </div>
  );
}
