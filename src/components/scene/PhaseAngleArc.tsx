"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import {
  EARTH_ORBIT_AU,
  MARS_ORBIT_AU,
  angleDiff,
} from "@/lib/orbital";

interface PhaseAngleArcProps {
  earthAngle: number;
  marsAngle: number;
  visible: boolean;
}

/**
 * Draws an arc showing the current Earth–Mars phase angle,
 * plus faint radial spokes to each planet.
 */
export function PhaseAngleArc({
  earthAngle,
  marsAngle,
  visible,
}: PhaseAngleArcProps) {
  const { arcPoints, earthSpoke, marsSpoke, midLabelPos } = useMemo(() => {
    const phase = angleDiff(marsAngle, earthAngle);
    const absPhase = Math.abs(phase);
    const steps = Math.max(8, Math.floor(absPhase * 24));
    const r = ((EARTH_ORBIT_AU + MARS_ORBIT_AU) / 2) * 0.55;
    const arcPoints: [number, number, number][] = [];
    const start = earthAngle;
    for (let i = 0; i <= steps; i++) {
      const a = start + (phase * i) / steps;
      arcPoints.push([Math.cos(a) * r, 0.01, Math.sin(a) * r]);
    }
    const midA = start + phase / 2;
    const midLabelPos: [number, number, number] = [
      Math.cos(midA) * (r + 0.12),
      0.08,
      Math.sin(midA) * (r + 0.12),
    ];
    const earthSpoke: [number, number, number][] = [
      [0, 0, 0],
      [
        Math.cos(earthAngle) * EARTH_ORBIT_AU,
        0,
        Math.sin(earthAngle) * EARTH_ORBIT_AU,
      ],
    ];
    const marsSpoke: [number, number, number][] = [
      [0, 0, 0],
      [
        Math.cos(marsAngle) * MARS_ORBIT_AU,
        0,
        Math.sin(marsAngle) * MARS_ORBIT_AU,
      ],
    ];
    return { arcPoints, earthSpoke, marsSpoke, midLabelPos };
  }, [earthAngle, marsAngle]);

  if (!visible) return null;

  return (
    <group>
      <Line
        points={arcPoints}
        color="#a78bfa"
        transparent
        opacity={0.75}
        lineWidth={1.5}
      />
      <Line
        points={earthSpoke}
        color="#38bdf8"
        transparent
        opacity={0.22}
        lineWidth={1}
      />
      <Line
        points={marsSpoke}
        color="#fb923c"
        transparent
        opacity={0.22}
        lineWidth={1}
      />
      <mesh position={midLabelPos}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#a78bfa" />
      </mesh>
    </group>
  );
}
