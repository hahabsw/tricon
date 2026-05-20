"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatedBackground } from "./AnimatedBackground";

function Aurora({ intensity = 1 }: { intensity?: number }) {
  const op = 0.18 + 0.12 * intensity;
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        opacity: op,
        overflow: "hidden",
      }}
    >
      <div
        className="fx-aurora fx-aurora-a"
        style={{
          position: "absolute",
          top: "20%",
          left: "18%",
          width: 520,
          height: 520,
          borderRadius: 9999,
          background: "rgba(34,211,238,0.55)",
          filter: "blur(140px)",
        }}
      />
      <div
        className="fx-aurora fx-aurora-b"
        style={{
          position: "absolute",
          bottom: "12%",
          right: "12%",
          width: 560,
          height: 560,
          borderRadius: 9999,
          background: "rgba(232,121,249,0.55)",
          filter: "blur(150px)",
        }}
      />
      <div
        className="fx-aurora fx-aurora-a"
        style={{
          position: "absolute",
          bottom: "40%",
          left: "55%",
          width: 420,
          height: 420,
          borderRadius: 9999,
          background: "rgba(52,211,153,0.45)",
          filter: "blur(160px)",
          animationDelay: "-9s",
        }}
      />
      <div
        className="fx-aurora fx-aurora-b"
        style={{
          position: "absolute",
          top: "60%",
          left: "8%",
          width: 320,
          height: 320,
          borderRadius: 9999,
          background: "rgba(255,212,58,0.30)",
          filter: "blur(120px)",
          animationDelay: "-14s",
        }}
      />
    </div>
  );
}

function GridOverlay() {
  return <div className="fx-grid-overlay" aria-hidden />;
}

function ScanLine() {
  return (
    <div className="fx-scanline-host" aria-hidden>
      <div className="fx-scanline" />
    </div>
  );
}

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isGame = pathname?.startsWith("/game/");

  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden bg-space-900">
        <AnimatedBackground parallax={!isGame} />
        <Aurora />
        <GridOverlay />
        {!isGame && <ScanLine />}
      </div>
      <main className="relative z-10 min-h-dvh">
        <div key={pathname} className="page-transition-sharp min-h-dvh">
          {children}
        </div>
      </main>
    </>
  );
}
