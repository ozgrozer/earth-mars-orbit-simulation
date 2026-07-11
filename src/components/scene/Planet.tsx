"use client";

import { useRef } from "react";
import { Html } from "@react-three/drei";
import type { Mesh } from "three";

interface PlanetProps {
  position: [number, number, number];
  radius: number;
  color: string;
  emissive?: string;
  label?: string;
  labelColor?: string;
}

export function Planet({
  position,
  radius,
  color,
  emissive,
  label,
  labelColor = "#e2e8f0",
}: PlanetProps) {
  const ref = useRef<Mesh>(null);

  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive ?? color}
          emissiveIntensity={emissive ? 0.35 : 0.15}
          roughness={0.55}
          metalness={0.1}
        />
      </mesh>
      {/* Soft glow shell */}
      <mesh scale={1.35}>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
      {label && (
        <Html
          distanceFactor={6}
          position={[0, radius * 2.2, 0]}
          style={{
            pointerEvents: "none",
            userSelect: "none",
            whiteSpace: "nowrap",
            color: labelColor,
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          }}
          center
        >
          {label}
        </Html>
      )}
    </group>
  );
}
