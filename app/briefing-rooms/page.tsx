"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { joinRoomById } from "../../src/client/network/client";
import type { PublicRoomSummary } from "../../src/shared/roomListing";

const formatCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(createdAt));

export default function BriefingRoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<PublicRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadRooms = async (isInitialLoad = false) => {
      if (isInitialLoad) {
        setLoading(true);
      }

      try {
        const response = await fetch("/api/public-rooms", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("failed_to_load_public_rooms");
        }

        const data = (await response.json()) as { rooms?: PublicRoomSummary[] };
        if (active) {
          setRooms(data.rooms ?? []);
          setError(null);
        }
      } catch {
        if (active) {
          setError("공개 브리핑룸 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (active && isInitialLoad) {
          setLoading(false);
        }
      }
    };

    void loadRooms(true);
    const intervalId = window.setInterval(() => {
      void loadRooms(false);
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const roomCountLabel = useMemo(() => {
    if (loading) {
      return "불러오는 중";
    }

    return `${rooms.length}개의 공개 브리핑룸`;
  }, [loading, rooms.length]);

  const handleJoin = async (roomId: string) => {
    setJoiningRoomId(roomId);
    try {
      const room = await joinRoomById(roomId);
      router.push(`/game/${room.roomId}`);
    } catch {
      alert("입장할 수 없는 방입니다. 목록을 새로고침해 주세요.");
      setJoiningRoomId(null);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden text-white">
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300/70">
              Briefing Room Directory
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              대기 중인 공개 방
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/65 sm:text-base">
              아직 게임이 시작되지 않은 공개 브리핑룸만 보여줍니다. 비공개 방은 방 코드로만 입장할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10"
            >
              홈으로
            </Link>
            <Link
              href="/lobby"
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              새 방 만들기
            </Link>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-white/45">Status</div>
            <div className="mt-1 text-lg font-bold">{roomCountLabel}</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10"
          >
            새로고침
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4">
          {!loading && rooms.length === 0 && !error && (
            <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 px-6 py-10 text-center">
              <div className="text-xl font-bold">현재 대기 중인 공개 방이 없습니다</div>
              <p className="mt-3 text-sm text-white/60">
                직접 공개 방을 만들거나, 비공개 방 코드를 받아서 홈 화면에서 입장할 수 있습니다.
              </p>
            </div>
          )}

          {rooms.map((room) => (
            <div
              key={room.roomId}
              className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-[0_0_30px_rgba(0,0,0,0.35)]"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
                      Waiting
                    </span>
                    <span className="font-mono text-sm tracking-[0.25em] text-cyan-300">
                      {room.roomId}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{room.hostName}</h2>
                    <p className="mt-1 text-sm text-white/55">
                      생성 시각 {formatCreatedAt(room.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm text-white/75">
                    <span className="rounded-full bg-white/5 px-3 py-1">
                      인원 {room.playerCount}/{room.maxPlayers}
                    </span>
                    <span className="rounded-full bg-white/5 px-3 py-1">
                      사람 {room.humanPlayerCount}명
                    </span>
                    <span className="rounded-full bg-white/5 px-3 py-1">
                      AI {room.aiPlayerCount}명
                    </span>
                    <span className="rounded-full bg-white/5 px-3 py-1">
                      별 {room.starCount}개
                    </span>
                    <span className="rounded-full bg-white/5 px-3 py-1">
                      턴 {room.turnTimeSeconds}초
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleJoin(room.roomId)}
                  disabled={joiningRoomId === room.roomId}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_0_24px_rgba(16,185,129,0.25)] transition hover:from-cyan-500 hover:to-emerald-500 disabled:cursor-wait disabled:opacity-70 lg:w-auto"
                >
                  {joiningRoomId === room.roomId ? "Joining..." : "입장"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
