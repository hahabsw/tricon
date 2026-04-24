"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatedBackground } from "./AnimatedBackground";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden bg-space-900">
        <AnimatedBackground />
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-cyan-500/30 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-[120px]" />
          <div className="absolute bottom-16 left-1/3 h-80 w-80 rounded-full bg-emerald-500/15 blur-[140px]" />
        </div>
      </div>
      <main className="relative z-10 min-h-dvh">
        <div key={pathname} className="page-transition min-h-dvh">
          {children}
        </div>
      </main>
    </>
  );
}
