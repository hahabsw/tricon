"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Application, extend, useApplication } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useGameStore } from '../store/gameStore';
import { sendPlaceEdge } from '../network/client';
import { PLAYER_COLORS, MAX_CONNECTIONS_PER_STAR, MAX_EDGE_DISTANCE } from '../../game/state';

extend({ Container, Graphics });

// Helper component that has access to useApplication()
const BoardRenderer = () => {
  const { app } = useApplication();
  const { 
    stars, edges, triangles, myPlayerId, currentTurnPlayerId, phase,
    selectedStar, hoveredStar, selectStar, setHoveredStar, settings 
  } = useGameStore();
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isMyTurn = myPlayerId === currentTurnPlayerId && phase === 'playing';

  // Board dimensions handling
  const width = app?.screen.width ?? 0;
  const height = app?.screen.height ?? 0;
  
  const padding = 40;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const toScreen = (nx: number, ny: number) => ({
    x: padding + nx * usableWidth,
    y: padding + ny * usableHeight
  });

  const getPlayerColorHex = (id: string): number => {
    // Find player index to assign color
    const players = useGameStore.getState().turnOrder;
    const idx = players.indexOf(id);
    const colorStr = PLAYER_COLORS[idx] || "#ffffff";
    return parseInt(colorStr.replace('#', '0x'), 16);
  };

  useEffect(() => {
    if (!app) return;
    const canvas = app.canvas as HTMLCanvasElement;
    const handleMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = app.screen.width / rect.width;
      const scaleY = app.screen.height / rect.height;
      setMousePos({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      });
    };
    canvas.addEventListener('pointermove', handleMove);
    return () => canvas.removeEventListener('pointermove', handleMove);
  }, [app]);

  // Animation tracking
  const animEdges = useRef<Map<number, number>>(new Map());
  const animTris = useRef<Map<number, number>>(new Map());
  const prevEdgesCount = useRef(edges.length);
  const prevTrisCount = useRef(triangles.length);
  const timeRef = useRef(0);

  useEffect(() => {
    if (triangles.length > prevTrisCount.current) {
      for (let i = prevTrisCount.current; i < triangles.length; i++) {
        animTris.current.set(triangles[i].id, timeRef.current);
      }
    }
    prevTrisCount.current = triangles.length;
  }, [triangles]);

  const stateRef = useRef({ edges, triangles, stars, selectedStar, hoveredStar, mousePos, myPlayerId, isMyTurn, width, height, usableWidth, usableHeight, padding, settings });
  useEffect(() => {
    stateRef.current = { edges, triangles, stars, selectedStar, hoveredStar, mousePos, myPlayerId, isMyTurn, width, height, usableWidth, usableHeight, padding, settings };
  }, [edges, triangles, stars, selectedStar, hoveredStar, mousePos, myPlayerId, isMyTurn, width, height, usableWidth, usableHeight, padding, settings]);

  const selectionStartRef = useRef<number | null>(null);
  const prevSelectedRef = useRef<number | null>(null);

  useEffect(() => {
    if (selectedStar !== null && prevSelectedRef.current !== selectedStar) {
      selectionStartRef.current = timeRef.current;
    } else if (selectedStar === null) {
      selectionStartRef.current = null;
    }
    prevSelectedRef.current = selectedStar;
  }, [selectedStar]);

  const bgGraphicsRef = useRef<import('pixi.js').Graphics>(null);
  const rangeGraphicsRef = useRef<import('pixi.js').Graphics>(null);
  const trisGraphicsRef = useRef<import('pixi.js').Graphics>(null);
  const edgesGraphicsRef = useRef<import('pixi.js').Graphics>(null);
  const starsGraphicsRef = useRef<import('pixi.js').Graphics>(null);

  const animStars = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    if (edges.length > prevEdgesCount.current) {
      for (let i = prevEdgesCount.current; i < edges.length; i++) {
        const e = edges[i];
        animEdges.current.set(e.id, timeRef.current);
        animStars.current.set(e.starA, timeRef.current);
        animStars.current.set(e.starB, timeRef.current);
      }
    }
    prevEdgesCount.current = edges.length;
  }, [edges]);

  // Main animation ticker
  useEffect(() => {
    if (!app) return;
    const tick = () => {
      timeRef.current += app.ticker.deltaMS;
      const state = stateRef.current;
      const time = timeRef.current;

      const getScreenCoords = (nx: number, ny: number) => ({
        x: state.padding + nx * state.usableWidth,
        y: state.padding + ny * state.usableHeight
      });

      // Background
      if (bgGraphicsRef.current) {
        const g = bgGraphicsRef.current;
        g.clear();
        if (state.isMyTurn) {
          const alpha = 0.3 + 0.2 * Math.sin(time / 500);
          g.rect(0, 0, state.width, state.height).stroke({ color: getPlayerColorHex(state.myPlayerId), width: 4, alpha });
        }
      }

      // Range circle
      if (rangeGraphicsRef.current) {
        const g = rangeGraphicsRef.current;
        g.clear();
        if (state.selectedStar !== null && state.isMyTurn && selectionStartRef.current !== null) {
          const selStar = state.stars.find(s => s.id === state.selectedStar);
          if (selStar) {
            const center = getScreenCoords(selStar.x, selStar.y);
            const maxDist = MAX_EDGE_DISTANCE[state.settings.starCount] ?? 0.30;
            const targetRadiusX = maxDist * state.usableWidth;
            const targetRadiusY = maxDist * state.usableHeight;

            const elapsed = time - selectionStartRef.current;
            const expandDuration = 300;
            const progress = Math.min(elapsed / expandDuration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);

            const rx = targetRadiusX * ease;
            const ry = targetRadiusY * ease;
            const playerColor = getPlayerColorHex(state.myPlayerId);
            const breathe = 0.08 + 0.04 * Math.sin(time / 600);

            g.ellipse(center.x, center.y, rx, ry).stroke({ color: playerColor, width: 1.5, alpha: breathe + 0.1 });
            g.ellipse(center.x, center.y, rx, ry).fill({ color: playerColor, alpha: breathe * 0.3 });
          }
        }
      }

      // Triangles
      if (trisGraphicsRef.current) {
        const g = trisGraphicsRef.current;
        g.clear();
        state.triangles.forEach(t => {
          const s0 = state.stars.find(s => s.id === t.stars[0]);
          const s1 = state.stars.find(s => s.id === t.stars[1]);
          const s2 = state.stars.find(s => s.id === t.stars[2]);
          if (!s0 || !s1 || !s2) return;
          
          const p0 = getScreenCoords(s0.x, s0.y);
          const p1 = getScreenCoords(s1.x, s1.y);
          const p2 = getScreenCoords(s2.x, s2.y);
          
          const color = getPlayerColorHex(t.owner);
          const animStart = animTris.current.get(t.id);
          
          if (animStart) {
            const elapsed = time - animStart;
            if (elapsed < 800) {
              const progress = Math.min(elapsed / 800, 1);
              const cx = (p0.x + p1.x + p2.x) / 3;
              const cy = (p0.y + p1.y + p2.y) / 3;
              
              // Scale expands from center (ease out cubic)
              const scale = 1 - Math.pow(1 - progress, 3);
              const fillAlpha = 0.8 - (0.55 * progress); // 0.8 fades to 0.25
              
              const sp0 = { x: cx + (p0.x - cx)*scale, y: cy + (p0.y - cy)*scale };
              const sp1 = { x: cx + (p1.x - cx)*scale, y: cy + (p1.y - cy)*scale };
              const sp2 = { x: cx + (p2.x - cx)*scale, y: cy + (p2.y - cy)*scale };
              
              g.poly([sp0.x, sp0.y, sp1.x, sp1.y, sp2.x, sp2.y])
               .fill({ color, alpha: fillAlpha })
               .stroke({ color, width: 2, alpha: 0.8 });
            } else {
              animTris.current.delete(t.id);
              g.poly([p0.x, p0.y, p1.x, p1.y, p2.x, p2.y]).fill({ color, alpha: 0.25 }).stroke({ color, width: 2, alpha: 0.8 });
            }
          } else {
            g.poly([p0.x, p0.y, p1.x, p1.y, p2.x, p2.y]).fill({ color, alpha: 0.25 }).stroke({ color, width: 2, alpha: 0.8 });
          }
        });
      }

      // Edges
      if (edgesGraphicsRef.current) {
        const g = edgesGraphicsRef.current;
        g.clear();
        state.edges.forEach(e => {
          const sA = state.stars.find(s => s.id === e.starA);
          const sB = state.stars.find(s => s.id === e.starB);
          if (!sA || !sB) return;
          
          const p1 = getScreenCoords(sA.x, sA.y);
          const p2 = getScreenCoords(sB.x, sB.y);
          const color = getPlayerColorHex(e.placedBy);
          
          const animStart = animEdges.current.get(e.id);
          let alphaMult = 1;
          let widthMult = 1;
          
          if (animStart) {
            const elapsed = time - animStart;
            if (elapsed < 600) {
              const progress = Math.min(elapsed / 600, 1);
              alphaMult = progress; // fade in 0 -> 1
              widthMult = 1 + (1 - progress) * 2; // start wide (3x), settle to normal (1x)
            } else {
              animEdges.current.delete(e.id);
            }
          }
          
          // Translucent wide glow
          g.moveTo(p1.x, p1.y).lineTo(p2.x, p2.y).stroke({ color, width: 6 * widthMult, alpha: 0.3 * alphaMult });
          // Opaque narrower core
          g.moveTo(p1.x, p1.y).lineTo(p2.x, p2.y).stroke({ color, width: 2 * widthMult, alpha: 0.9 * alphaMult });
        });

        // Preview edge
        if (state.selectedStar !== null && state.isMyTurn) {
          const s1 = state.stars.find(s => s.id === state.selectedStar);
          if (s1) {
            const p1 = getScreenCoords(s1.x, s1.y);
            const p2 = state.hoveredStar !== null 
              ? getScreenCoords(state.stars.find(s => s.id === state.hoveredStar)!.x, state.stars.find(s => s.id === state.hoveredStar)!.y) 
              : state.mousePos;
            
            let isValid = state.hoveredStar !== null && state.hoveredStar !== state.selectedStar;
            if (isValid) {
                const hStar = state.stars.find(s => s.id === state.hoveredStar);
                if (hStar && hStar.connectionCount >= MAX_CONNECTIONS_PER_STAR) isValid = false;
                if (hStar && s1) {
                  const edx = s1.x - hStar.x;
                  const edy = s1.y - hStar.y;
                  const eDist = Math.sqrt(edx * edx + edy * edy);
                  const maxDist = MAX_EDGE_DISTANCE[state.settings.starCount] ?? 0.30;
                  if (eDist > maxDist) isValid = false;
                }
            }

            const color = isValid ? 0x00ff00 : (state.hoveredStar ? 0xff0000 : 0xaaaaaa);
            
            // Dashed pulsating line
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const dashLen = 12;
            const gapLen = 8;
            const phaseOffset = (time / 15) % (dashLen + gapLen);
            
            const pulse = 0.5 + Math.sin(time / 150) * 0.3;
            
            let currentDist = phaseOffset - (dashLen + gapLen);
            while (currentDist < dist) {
              const startD = Math.max(0, currentDist);
              const endD = Math.min(dist, currentDist + dashLen);
              if (startD < dist) {
                const startX = p1.x + (dx / dist) * startD;
                const startY = p1.y + (dy / dist) * startD;
                const endX = p1.x + (dx / dist) * endD;
                const endY = p1.y + (dy / dist) * endD;
                g.moveTo(startX, startY).lineTo(endX, endY).stroke({ color, width: 2, alpha: pulse });
              }
              currentDist += dashLen + gapLen;
            }
          }
        }
      }
      // Stars
      if (starsGraphicsRef.current) {
        const g = starsGraphicsRef.current;
        g.clear();
        const maxDist = MAX_EDGE_DISTANCE[state.settings.starCount] ?? 0.30;

        state.stars.forEach(s => {
          const p = getScreenCoords(s.x, s.y);
          const isSelected = state.selectedStar === s.id;
          const isHovered = state.hoveredStar === s.id;
          const isFull = s.connectionCount >= MAX_CONNECTIONS_PER_STAR;
          const remaining = MAX_CONNECTIONS_PER_STAR - s.connectionCount;

          let isDead = isFull;
          if (!isDead) {
            const hasReachable = state.stars.some(other => {
              if (other.id === s.id) return false;
              if (other.connectionCount >= MAX_CONNECTIONS_PER_STAR) return false;
              const dx = s.x - other.x;
              const dy = s.y - other.y;
              return Math.sqrt(dx * dx + dy * dy) <= maxDist;
            });
            if (!hasReachable) isDead = true;
          }

          let color = 0xffffff;
          if (isDead) color = 0x556677;
          if (isSelected) color = 0x00ff00;
          else if (isHovered && state.isMyTurn && !isDead) color = 0xffff00;

          const outerRadius = 12;
          const innerRadius = 5;
          const brightness = isDead ? 0.25 : 0.6 + (s.connectionCount / MAX_CONNECTIONS_PER_STAR) * 0.4;

          const flashStart = animStars.current.get(s.id);
          let flashMult = 0;
          if (flashStart) {
            const elapsed = time - flashStart;
            if (elapsed < 500) {
              flashMult = 1 - (elapsed / 500);
            } else {
              animStars.current.delete(s.id);
            }
          }

          if (flashMult > 0) {
            g.circle(p.x, p.y, outerRadius + 10 * flashMult).fill({ color: 0xffffff, alpha: 0.3 * flashMult });
          }

          if (isDead) {
            g.circle(p.x, p.y, 8).stroke({ color: 0x556677, width: 1, alpha: 0.3 });
            g.circle(p.x, p.y, 2).fill({ color: 0x556677, alpha: 0.4 });
          } else if (remaining >= 2) {
            // Star polygon: N points where N = remaining connections
            const points = remaining;
            const rotation = -Math.PI / 2;
            const starPoints: number[] = [];
            for (let i = 0; i < points * 2; i++) {
              const angle = rotation + (i * Math.PI) / points;
              const r = i % 2 === 0 ? outerRadius : innerRadius;
              starPoints.push(p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r);
            }
            g.poly(starPoints).fill({ color, alpha: brightness * 0.15 });
            const midPoints: number[] = [];
            for (let i = 0; i < points * 2; i++) {
              const angle = rotation + (i * Math.PI) / points;
              const r = i % 2 === 0 ? outerRadius * 0.7 : innerRadius * 0.7;
              midPoints.push(p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r);
            }
            g.poly(midPoints).fill({ color, alpha: brightness * 0.4 });
            g.circle(p.x, p.y, 2.5).fill({ color: 0xffffff, alpha: 1 });
          } else {
            // remaining = 1: narrow diamond shape
            const spikeH = 10;
            const spikeW = 3;
            const diamondPts = [
              p.x, p.y - spikeH,
              p.x + spikeW, p.y,
              p.x, p.y + spikeH,
              p.x - spikeW, p.y,
            ];
            g.poly(diamondPts).fill({ color, alpha: brightness * 0.3 });
            const innerH = 6;
            const innerW = 2;
            const innerDiamondPts = [
              p.x, p.y - innerH,
              p.x + innerW, p.y,
              p.x, p.y + innerH,
              p.x - innerW, p.y,
            ];
            g.poly(innerDiamondPts).fill({ color, alpha: brightness * 0.6 });
            g.circle(p.x, p.y, 2).fill({ color: 0xffffff, alpha: 0.9 });
          }

          if (isSelected) {
            const pulseScale = 1 + 0.15 * Math.sin(time / 200);
            const ringRadius = (outerRadius + 4) * pulseScale;
            g.circle(p.x, p.y, ringRadius).stroke({ color, width: 2, alpha: 0.9 });
          } else if (isHovered && state.isMyTurn && !isDead) {
            g.circle(p.x, p.y, outerRadius + 4).stroke({ color, width: 2, alpha: 0.8 });
          }
        });
      }
    };
    app.ticker.add(tick);
    return () => { app.ticker.remove(tick); };
  }, [app]);

  const HIT_RADIUS = 20;

  return (
    <pixiContainer>
      <pixiGraphics ref={bgGraphicsRef} draw={() => {}} />
      <pixiGraphics ref={rangeGraphicsRef} draw={() => {}} />
      <pixiGraphics ref={trisGraphicsRef} draw={() => {}} />
      <pixiGraphics ref={edgesGraphicsRef} draw={() => {}} />
      <pixiGraphics ref={starsGraphicsRef} draw={() => {}} />
      {stars.map(s => {
        const p = toScreen(s.x, s.y);
        return (
          <pixiGraphics
            key={s.id}
            draw={(g) => {
              g.clear();
              g.circle(p.x, p.y, HIT_RADIUS).fill({ color: 0x000000, alpha: 0.001 });
            }}
            eventMode="static"
            cursor="pointer"
            onPointerOver={() => setHoveredStar(s.id)}
            onPointerOut={() => setHoveredStar(null)}
            onPointerDown={() => {
              if (!isMyTurn) return;
              if (selectedStar === null) {
                selectStar(s.id);
              } else if (selectedStar === s.id) {
                selectStar(null);
              } else {
                sendPlaceEdge(selectedStar, s.id);
                selectStar(null);
              }
            }}
          />
        );
      })}
    </pixiContainer>
  );
};

export const GameBoard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!isClient) return <div className="w-full h-full bg-space-900" />;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative border border-white/10 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-space-900 touch-none [&>canvas]:block [&>canvas]:w-full [&>canvas]:h-full"
    >
      <Application background="#050510" resizeTo={containerRef} antialias>
        <BoardRenderer />
      </Application>
    </div>
  );
};

export default GameBoard;
