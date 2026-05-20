"use client";

import { type CSSProperties, type ReactNode } from "react";
import { GlassBeam, HUDFrame } from "./Animations";

export function Glass({
  children,
  className = "",
  style,
  padding = "lg",
  hud = true,
  beam = true,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  padding?: "sm" | "md" | "lg" | "xl";
  hud?: boolean;
  beam?: boolean;
}) {
  const pad = ({ sm: "16px", md: "24px", lg: "32px", xl: "48px" } as const)[padding];
  return (
    <div
      className={`glass ${className}`}
      style={{
        background: "var(--glass-fill)",
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
        border: "1px solid var(--glass-border)",
        borderRadius: 32,
        boxShadow: "var(--shadow-panel)",
        padding: pad,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {beam && <GlassBeam />}
      {hud && <HUDFrame />}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
