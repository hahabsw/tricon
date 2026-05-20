"use client";

import { Sparkles } from "./Animations";

export function Logomark({ size = 64, animated = true }: { size?: number; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-label="Tricon"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="lm-star-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#A5F3FC" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lm-tri-fill" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.20" />
          <stop offset="50%" stopColor="#3DFFB3" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#FF3FE0" stopOpacity="0.20" />
        </linearGradient>
        <linearGradient id="lm-edge-stroke" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#00FFFF" />
          <stop offset="50%" stopColor="#3DFFB3" />
          <stop offset="100%" stopColor="#FF3FE0" />
        </linearGradient>
      </defs>

      <g
        style={
          animated
            ? { transformOrigin: "32px 37px", animation: "tk-mark-spin 60s linear infinite" }
            : undefined
        }
      >
        <polygon points="32,8 56,52 8,52" fill="url(#lm-tri-fill)" />
        <g stroke="url(#lm-edge-stroke)" strokeWidth="2.5" strokeLinecap="round">
          <line x1="32" y1="8" x2="56" y2="52" />
          <line x1="56" y1="52" x2="8" y2="52" />
          <line x1="8" y1="52" x2="32" y2="8" />
        </g>
      </g>

      <g>
        <circle
          cx="32"
          cy="8"
          r="10"
          fill="url(#lm-star-glow)"
          style={
            animated
              ? { transformOrigin: "32px 8px", animation: "tk-twinkle 2.6s ease-in-out infinite" }
              : undefined
          }
        />
        <circle
          cx="56"
          cy="52"
          r="10"
          fill="url(#lm-star-glow)"
          style={
            animated
              ? {
                  transformOrigin: "56px 52px",
                  animation: "tk-twinkle 2.6s 0.6s ease-in-out infinite",
                }
              : undefined
          }
        />
        <circle
          cx="8"
          cy="52"
          r="10"
          fill="url(#lm-star-glow)"
          style={
            animated
              ? {
                  transformOrigin: "8px 52px",
                  animation: "tk-twinkle 2.6s 1.2s ease-in-out infinite",
                }
              : undefined
          }
        />
      </g>

      <g fill="#ffffff">
        <circle cx="32" cy="8" r="3" />
        <circle cx="56" cy="52" r="3" />
        <circle cx="8" cy="52" r="3" />
      </g>
    </svg>
  );
}

export function Wordmark({
  size = 64,
  animated = true,
  stagger = true,
}: {
  size?: number;
  animated?: boolean;
  stagger?: boolean;
}) {
  const letters = "Tricon".split("");
  const letterStyle = {
    display: "inline-block",
    background: "var(--gradient-tricon)",
    backgroundSize: "200% 200%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    willChange: "opacity, transform, filter",
  } as const;

  return (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 900,
        fontSize: size,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        display: "inline-block",
        position: "relative",
      }}
    >
      {letters.map((ch, i) => (
        <span
          key={i}
          style={{
            ...letterStyle,
            animation: stagger
              ? `tk-letter-in 700ms cubic-bezier(0.2, 0.9, 0.2, 1) ${i * 90 + 120}ms both, tricon-gradient-shift 6s ease-in-out infinite`
              : animated
                ? "tricon-gradient-shift 6s ease-in-out infinite"
                : "none",
          }}
        >
          {ch}
        </span>
      ))}
      <span aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Sparkles count={5} color="rgba(255,255,255,0.85)" />
      </span>
    </span>
  );
}
