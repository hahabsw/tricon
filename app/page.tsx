"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Points, PointMaterial, OrbitControls } from '@react-three/drei'
import * as THREE from "three";
import { rotate } from "maath/dist/declarations/src/buffer";

// 은하수 형태의 별 분포 생성 함수
function generateGalaxyPositions(count: number, radius: number, arms: number = 4) {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    // 나선 팔 선택
    const armIndex = Math.floor(Math.random() * arms);
    const armAngle = (armIndex / arms) * Math.PI * 2;
    
    // 나선 곡선을 따라 위치 결정 (로그 나선)
    const t = Math.random();
    const spiralRadius = radius * Math.sqrt(t); // 중심에서 멀어질수록 밀도 감소 (더 자연스러운 분포)
    const spiralAngle = spiralRadius * 0.8 + armAngle; // 나선 각도 (더 타이트한 나선)
    
    // 나선 곡선의 기본 위치
    const baseX = Math.cos(spiralAngle) * spiralRadius;
    const baseY = Math.sin(spiralAngle) * spiralRadius;
    
    // 나선 주변에 노이즈 추가 (은하수처럼 부드러운 곡선)
    // 나선 방향에 수직인 방향으로 노이즈 추가
    const perpendicularAngle = spiralAngle + Math.PI / 2;
    const noiseAmount = (Math.random() - 0.5) * radius * 0.4 * (1 - t * 0.7); // 중심에서 멀수록 노이즈 감소
    const noiseX = Math.cos(perpendicularAngle) * noiseAmount;
    const noiseY = Math.sin(perpendicularAngle) * noiseAmount;
    
    // 나선 방향으로도 약간의 노이즈 추가 (더 자연스러운 곡선)
    const alongSpiralNoise = (Math.random() - 0.5) * radius * 0.2 * (1 - t);
    const alongX = Math.cos(spiralAngle) * alongSpiralNoise;
    const alongY = Math.sin(spiralAngle) * alongSpiralNoise;
    
    // 최종 위치
    const x = baseX + noiseX + alongX;
    const y = baseY + noiseY + alongY;
    const z = (Math.random() - 0.5) * radius * 0.1; // 약간의 깊이
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  
  return positions;
}

// 패럴랙스 별 레이어 컴포넌트
function ParallaxStarLayer({ 
  count, 
  radius, 
  center,
  speed, 
  color, 
  size,
  mousePosition,
  arms = 4, 
  rotateSpeed = 0.001  
}: { 
  count: number; 
  radius: number; 
  center: { x: number; y: number };
  speed: number; 
  color: string;
  size: number;
  mousePosition: { x: number; y: number };
  arms?: number;
  rotateSpeed?: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const [positions] = useState(() => generateGalaxyPositions(count, radius, arms));

  useFrame(() => {
    if (ref.current) {
      // 마우스 위치에 따라 패럴랙스 효과 적용
      ref.current.position.x = (mousePosition.x - center.x) * speed;
      ref.current.position.y = (mousePosition.y - center.y) * speed;
      ref.current.rotation.set(0, 0, Math.sin(Date.now() * rotateSpeed) * 0.01, 'ZXY');
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}
    >
      <PointMaterial 
        transparent 
        color={color} 
        size={size} 
        sizeAttenuation={true} 
        depthWrite={false} 
      />
    </Points>
  );
}

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x: x * 2, y: y * 2 });
  };

  return (
    <div 
      id="canvas-container"
      onMouseMove={handleMouseMove}
      style={{ width: '100%', height: '100vh', cursor: 'grab' }}
    >
      <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
        {/* 2D top view로 고정된 카메라 설정 */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={false}
          minDistance={20}
          maxDistance={200}
          // 완전히 위에서 내려다보는 각도로 고정
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
          // 수평 회전도 고정
          minAzimuthAngle={0}
          maxAzimuthAngle={0}
        />
        
        {/* 배경 별 레이어들 - 은하수 형태로 군집된 패럴랙스 효과 */}
        <ParallaxStarLayer 
          count={2000} 
          radius={80} 
          center={{ x: 0, y: 0 }}
          speed={0.1} 
          color="#ffffff" 
          size={0.5}
          mousePosition={mousePosition}
          arms={6}
        />
        <ParallaxStarLayer 
          count={1500} 
          radius={60} 
          center={{ x: 20, y: 20 }}
          speed={0.2} 
          color="#aaccff" 
          size={0.4}
          mousePosition={mousePosition}
          arms={4}
        />
        <ParallaxStarLayer 
          count={1000} 
          radius={40} 
          center={{ x: -20, y: -20 }}
          speed={0.3} 
          color="#ffaacc" 
          size={0.3}
          mousePosition={mousePosition}
          arms={3}
        />
        <ParallaxStarLayer 
          count={800} 
          radius={25} 
          center={{ x: 20, y: -20 }}
          speed={0.4} 
          color="#ffffaa" 
          size={0.25}
          mousePosition={mousePosition}
          arms={3}
        />
        <ParallaxStarLayer 
          count={800} 
          radius={150} 
          center={{ x: -20, y: 20 }}
          speed={0.5} 
          color="#008888" 
          size={0.2}
          mousePosition={mousePosition}
          arms={2}
        />
      </Canvas>
    </div>
  );
}
