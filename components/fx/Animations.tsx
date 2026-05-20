"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function useEasedNumber(
  target: number,
  { ms = 700, ease = (t: number) => 1 - Math.pow(1 - t, 3) }: { ms?: number; ease?: (t: number) => number } = {},
) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const targetRef = useRef(target);

  useEffect(() => {
    if (target === targetRef.current) return;
    fromRef.current = value;
    targetRef.current = target;
    startRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / ms);
      const eased = ease(t);
      const v = fromRef.current + (target - fromRef.current) * eased;
      setValue(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

export function AnimatedCounter({
  value,
  format = (v: number) => v.toFixed(0),
  style,
  className,
}: {
  value: number;
  format?: (v: number) => string;
  style?: CSSProperties;
  className?: string;
}) {
  const v = useEasedNumber(value);
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {format(v)}
    </span>
  );
}

export function LetterStagger({
  text,
  delayBase = 0,
  step = 60,
  style,
  className,
}: {
  text: string;
  delayBase?: number;
  step?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <span className={`letter-stagger ${className ?? ""}`} style={style}>
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          className="ltr"
          style={{ animationDelay: `${delayBase + i * step}ms` }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

export function HUDFrame({
  color = "rgba(34, 211, 238, 0.55)",
  inset = 10,
  size = 22,
  thickness = 1.5,
  animate = true,
}: {
  color?: string;
  inset?: number;
  size?: number;
  thickness?: number;
  animate?: boolean;
}) {
  const corner = (pos: "tl" | "tr" | "bl" | "br"): CSSProperties => {
    const base: CSSProperties = {
      position: "absolute",
      width: size,
      height: size,
      pointerEvents: "none",
      borderColor: color,
    };
    const map: Record<typeof pos, CSSProperties> = {
      tl: { top: inset, left: inset,    borderTop: `${thickness}px solid`, borderLeft:  `${thickness}px solid`, borderRadius: "4px 0 0 0" },
      tr: { top: inset, right: inset,   borderTop: `${thickness}px solid`, borderRight: `${thickness}px solid`, borderRadius: "0 4px 0 0" },
      bl: { bottom: inset, left: inset, borderBottom: `${thickness}px solid`, borderLeft:  `${thickness}px solid`, borderRadius: "0 0 0 4px" },
      br: { bottom: inset, right: inset, borderBottom: `${thickness}px solid`, borderRight: `${thickness}px solid`, borderRadius: "0 0 4px 0" },
    };
    return {
      ...base,
      ...map[pos],
      ...(animate ? { animation: "tk-corner-in 700ms ease-out 200ms both" } : {}),
    };
  };
  return (
    <>
      <span aria-hidden style={corner("tl")} />
      <span aria-hidden style={corner("tr")} />
      <span aria-hidden style={corner("bl")} />
      <span aria-hidden style={corner("br")} />
    </>
  );
}

export function Shimmer({ trigger }: { trigger: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("run");
    void el.offsetWidth;
    el.classList.add("run");
  }, [trigger]);
  return <span ref={ref} className="btn-shimmer" aria-hidden />;
}

/**
 * Drop-in shimmer that re-runs on every mouseenter of its closest <button>
 * ancestor. The button must have `position: relative` and `overflow: hidden`.
 */
export function HoverShimmer() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const btn = el.closest("button");
    if (!btn) return;
    const onEnter = () => {
      el.classList.remove("run");
      void el.offsetWidth;
      el.classList.add("run");
    };
    btn.addEventListener("mouseenter", onEnter);
    return () => btn.removeEventListener("mouseenter", onEnter);
  }, []);
  return <span ref={ref} className="btn-shimmer" aria-hidden />;
}

export function Sparkles({
  count = 6,
  color = "rgba(255,255,255,0.85)",
}: {
  count?: number;
  color?: string;
}) {
  const positions = useMemo(() => {
    const seeded = (i: number) => {
      const x = Math.sin(i * 132.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      x: seeded(i + 1) * 100,
      y: seeded(i + 17) * 100,
      d: 1 + seeded(i + 31) * 2,
      delay: seeded(i + 43) * 2.4,
    }));
  }, [count]);
  return (
    <>
      {positions.map((p, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.d,
            height: p.d,
            borderRadius: 9999,
            background: color,
            boxShadow: `0 0 ${p.d * 4}px ${color}`,
            opacity: 0.7,
            animation: `tk-twinkle ${2 + p.delay}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
}

export function PulseRing({
  color = "rgba(34,211,238,0.6)",
  size = 60,
  duration = 1800,
}: {
  color?: string;
  size?: number;
  duration?: number;
}) {
  return (
    <>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: 9999,
          border: `1.5px solid ${color}`,
          animation: `tk-pulse-ring ${duration}ms ease-out infinite`,
          pointerEvents: "none",
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: 9999,
          border: `1.5px solid ${color}`,
          animation: `tk-pulse-ring ${duration}ms ease-out infinite`,
          animationDelay: `${duration / 2}ms`,
          pointerEvents: "none",
        }}
      />
    </>
  );
}

export function GlassBeam(): ReactNode {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 20%, rgba(167,243,208,0.7) 50%, rgba(255,255,255,0) 80%, transparent 100%)",
        backgroundSize: "200% 100%",
        backgroundPosition: "-100% 0",
        animation: "tk-glass-beam 6s linear infinite",
        pointerEvents: "none",
      }}
    />
  );
}
