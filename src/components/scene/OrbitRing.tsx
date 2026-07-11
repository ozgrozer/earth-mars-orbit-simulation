"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";

interface OrbitRingProps {
  radius: number;
  color?: string;
  opacity?: number;
}

export function OrbitRing({
  radius,
  color = "#4a5568",
  opacity = 0.45,
}: OrbitRingProps) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const n = 128;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return pts;
  }, [radius]);

  return (
    <Line
      points={points}
      color={color}
      transparent
      opacity={opacity}
      lineWidth={1}
    />
  );
}
