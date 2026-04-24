"use client";

import { useEffect, useRef } from "react";
import { PLAYER_COLORS } from "../src/game/state";

interface BgStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  speed: number;
}

interface BgEdge {
  a: number;
  b: number;
  born: number;
  durMs: number;
}

interface BgTriangle {
  stars: [number, number, number];
  born: number;
  durMs: number;
  colorIdx: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const starCount = Math.min(90, Math.max(25, Math.floor((w * h) / 18000)));
    const stars: BgStar[] = Array.from({ length: starCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.04,
      vy: (Math.random() - 0.5) * 0.04,
      r: Math.random() * 1.2 + 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.002 + 0.0008,
    }));

    const edges: BgEdge[] = [];
    const triangles: BgTriangle[] = [];

    let lastEdgeSpawn = 0;
    let lastTriSpawn = 0;

    const colors = PLAYER_COLORS.map((c) => hexToRgb(c));

    const findCluster = (
      minDist: number,
      maxDist: number,
      n: number
    ): number[] | null => {
      for (let tries = 0; tries < 20; tries++) {
        const seedIdx = Math.floor(Math.random() * stars.length);
        const seed = stars[seedIdx];
        const cluster: number[] = [seedIdx];
        for (let i = 0; i < stars.length; i++) {
          if (i === seedIdx) continue;
          const dx = stars[i].x - seed.x;
          const dy = stars[i].y - seed.y;
          const d = Math.hypot(dx, dy);
          if (d >= minDist && d <= maxDist) {
            cluster.push(i);
            if (cluster.length >= n) return cluster;
          }
        }
      }
      return null;
    };

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const start = performance.now();

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);

      const elapsed = now - start;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        if (!reducedMotion) {
          s.x += s.vx;
          s.y += s.vy;
          if (s.x < -10) s.x = w + 10;
          if (s.x > w + 10) s.x = -10;
          if (s.y < -10) s.y = h + 10;
          if (s.y > h + 10) s.y = -10;
        }

        const twinkle = reducedMotion
          ? 0.7
          : 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(s.phase + elapsed * s.speed));
        const r = s.r;

        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 7);
        glow.addColorStop(0, `rgba(200, 230, 255, ${twinkle * 0.65})`);
        glow.addColorStop(0.35, `rgba(120, 180, 255, ${twinkle * 0.12})`);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(s.x - r * 7, s.y - r * 7, r * 14, r * 14);

        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.fill();
      }

      if (!reducedMotion && now - lastEdgeSpawn > 1400 + Math.random() * 1800) {
        lastEdgeSpawn = now;
        const cluster = findCluster(60, 220, 2);
        if (cluster) {
          edges.push({ a: cluster[0], b: cluster[1], born: now, durMs: 3500 });
        }
      }

      if (!reducedMotion && now - lastTriSpawn > 7000 + Math.random() * 5000) {
        lastTriSpawn = now;
        const cluster = findCluster(70, 240, 3);
        if (cluster) {
          triangles.push({
            stars: [cluster[0], cluster[1], cluster[2]],
            born: now,
            durMs: 5500,
            colorIdx: Math.floor(Math.random() * colors.length),
          });
        }
      }

      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        const age = now - e.born;
        if (age >= e.durMs) {
          edges.splice(i, 1);
          continue;
        }
        const p = age / e.durMs;
        const alpha = Math.sin(p * Math.PI) * 0.4;
        const sa = stars[e.a];
        const sb = stars[e.b];
        const drawProgress = Math.min(1, p * 3);
        const endX = sa.x + (sb.x - sa.x) * drawProgress;
        const endY = sa.y + (sb.y - sa.y) * drawProgress;
        ctx.save();
        ctx.strokeStyle = `rgba(130, 220, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = "rgba(100, 220, 255, 0.6)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(sa.x, sa.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.restore();
      }

      for (let i = triangles.length - 1; i >= 0; i--) {
        const tri = triangles[i];
        const age = now - tri.born;
        if (age >= tri.durMs) {
          triangles.splice(i, 1);
          continue;
        }
        const p = age / tri.durMs;
        const alpha = Math.sin(p * Math.PI) * 0.35;
        const [s1, s2, s3] = [
          stars[tri.stars[0]],
          stars[tri.stars[1]],
          stars[tri.stars[2]],
        ];
        const [r, g, b] = colors[tri.colorIdx];

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.lineTo(s3.x, s3.y);
        ctx.closePath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.14})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      }
    };

    rafRef.current = requestAnimationFrame(loop);

    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden
    />
  );
};
