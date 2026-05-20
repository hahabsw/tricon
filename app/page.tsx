"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getNickname, setNickname } from "../src/client/identity";
import { Glass } from "../components/fx/Glass";
import { Logomark, Wordmark } from "../components/fx/Logo";
import { HoverShimmer, LetterStagger } from "../components/fx/Animations";

const RULE_COLORS = ["#00FFFF", "#FF3FE0", "#FFD43A", "#3DFFB3", "#22D3EE"];

function MiniConstellation() {
  const stars = useMemo(
    () => [
      { x: 40, y: 30 },
      { x: 110, y: 60 },
      { x: 175, y: 26 },
      { x: 240, y: 56 },
      { x: 310, y: 22 },
      { x: 380, y: 52 },
      { x: 450, y: 28 },
      { x: 520, y: 58 },
    ],
    [],
  );
  const [claims, setClaims] = useState<{ tri: number[]; color: string; key: number }[]>([]);
  const seqRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      const i = Math.floor(Math.random() * (stars.length - 2));
      const tri = [i, i + 1, i + 2];
      const color = RULE_COLORS[seqRef.current % RULE_COLORS.length];
      seqRef.current++;
      const key = seqRef.current;
      setClaims((cs) => [...cs.slice(-3), { tri, color, key }]);
      const tid = window.setTimeout(() => {
        setClaims((cs) => cs.filter((c) => c.key !== key));
      }, 3200);
      return () => window.clearTimeout(tid);
    }, 1500);
    return () => clearInterval(id);
  }, [stars]);

  return (
    <svg
      viewBox="0 0 560 80"
      width="100%"
      style={{ maxWidth: 560, display: "block" }}
      aria-hidden
    >
      <defs>
        <radialGradient id="mini-star-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#A5F3FC" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
      </defs>

      {stars.slice(0, -1).map((s, i) => (
        <line
          key={i}
          x1={s.x}
          y1={s.y}
          x2={stars[i + 1].x}
          y2={stars[i + 1].y}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1"
        />
      ))}

      {claims.map((c) => {
        const pts = c.tri.map((i) => `${stars[i].x},${stars[i].y}`).join(" ");
        return (
          <g key={c.key} className="fx-tri-pop" style={{ transformOrigin: "center" }}>
            <polygon
              points={pts}
              fill={c.color}
              fillOpacity="0.18"
              stroke={c.color}
              strokeWidth="1.2"
              style={{ filter: `drop-shadow(0 0 6px ${c.color})` }}
            />
          </g>
        );
      })}

      {stars.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r="10" fill="url(#mini-star-glow)" />
          <circle cx={s.x} cy={s.y} r="2.5" fill="white" />
        </g>
      ))}
    </svg>
  );
}

function NumberedRule({
  idx,
  color,
  children,
}: {
  idx: number;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(0,0,0,0.20)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontSize: 13,
          color,
          textShadow: `0 0 12px ${color}`,
          minWidth: 28,
          flexShrink: 0,
        }}
      >
        0{idx + 1}
      </span>
      <span style={{ color: "var(--fg-2)", fontSize: 14, lineHeight: 1.55 }}>{children}</span>
    </li>
  );
}

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [nickname, setNicknameState] = useState(() =>
    typeof window === "undefined" ? "" : getNickname()
  );

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
    <div className="relative min-h-dvh w-full overflow-x-hidden">
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-10">
        <Glass
          padding="lg"
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
            paddingTop: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", justifyContent: "center" }}>
            <Logomark size={64} />
            <Wordmark size={84} />
          </div>

          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.40em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              textAlign: "center",
            }}
          >
            <LetterStagger text="TURN-BASED · TRIANGLE TERRITORY" delayBase={700} step={28} />
          </span>

          <MiniConstellation />

          <a
            href="https://github.com/hahabsw/tricon"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-white/70 hover:text-white transition-colors underline underline-offset-4"
          >
            GitHub
          </a>

          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-white/50 font-bold px-1">
                Nickname
              </label>
              <input
                type="text"
                placeholder="Enter your nickname"
                value={nickname}
                maxLength={16}
                onChange={(e) => handleNicknameChange(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all tracking-wide"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="relative overflow-hidden w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-lg font-bold text-base sm:text-lg border border-white/20 hover:border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)] uppercase tracking-widest"
            >
              <span className="relative z-10">Create New Room</span>
              <HoverShimmer />
            </button>

            <button
              onClick={() => router.push("/briefing-rooms")}
              disabled={loading}
              className="relative overflow-hidden w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all rounded-lg font-bold text-base sm:text-lg border border-emerald-500/25 hover:border-emerald-400/50 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.12)] uppercase tracking-widest"
            >
              <span className="relative z-10">Browse Public Briefing Rooms</span>
              <HoverShimmer />
            </button>

            <button
              onClick={() => router.push("/leaderboard")}
              disabled={loading}
              className="relative overflow-hidden w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 transition-all rounded-lg font-bold text-base sm:text-lg border border-amber-500/25 hover:border-amber-400/50 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.12)] uppercase tracking-widest"
            >
              <span className="relative z-10">Leaderboard</span>
              <HoverShimmer />
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="Room Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-4 outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all uppercase text-center tracking-widest font-mono"
              />
              <button
                onClick={handleJoin}
                disabled={loading || !joinCode}
                className="relative overflow-hidden py-4 px-8 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 transition-all rounded-lg font-bold border border-cyan-500/50 w-full sm:w-auto uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">Join</span>
                <HoverShimmer />
              </button>
            </div>
          </div>

          <div
            className="w-full"
            style={{
              background: "var(--well-fill)",
              border: "1px solid var(--well-border)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: "-0.01em",
              }}
            >
              게임 플레이 방법
            </h2>
            <ul
              style={{
                margin: "14px 0 0",
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <NumberedRule idx={0} color={RULE_COLORS[0]}>
                내 턴에 <strong style={{ color: "white" }}>별 2개를 선택</strong>해서 선 1개를 그립니다.
              </NumberedRule>
              <NumberedRule idx={1} color={RULE_COLORS[1]}>
                선은 <strong style={{ color: "white" }}>공용</strong>이라서, 누구나 기존 선을 활용할 수 있어요.
              </NumberedRule>
              <NumberedRule idx={2} color={RULE_COLORS[2]}>
                내가 그은 선으로 <strong style={{ color: "white" }}>삼각형의 마지막 변</strong>이 완성되면 그 삼각형을 소유합니다.
              </NumberedRule>
              <NumberedRule idx={3} color={RULE_COLORS[3]}>
                삼각형을 완성하면 <strong style={{ color: "white" }}>보너스 턴 1회</strong>를 얻습니다. (연쇄 가능)
              </NumberedRule>
              <NumberedRule idx={4} color={RULE_COLORS[0]}>
                교차하는 선은 그을 수 없고, 같은 별 쌍은 중복 연결할 수 없어요.
              </NumberedRule>
              <NumberedRule idx={5} color={RULE_COLORS[1]}>
                턴을 직접 넘기거나 시간을 초과하면{" "}
                <strong style={{ color: "white" }}>가능한 선 중 하나가 랜덤으로 자동 배치</strong>됩니다.
              </NumberedRule>
            </ul>
          </div>
        </Glass>
      </div>
    </div>
  );
}
