"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { transferPathPoints } from "@/lib/orbital";

interface TransferPathProps {
  launchDay: number;
  color?: string;
  opacity?: number;
}

export function TransferPathDashed({
  launchDay,
  color = "#fbbf24",
  opacity = 0.55,
}: TransferPathProps) {
  const points = useMemo(
    () => transferPathPoints(launchDay, 160),
    [launchDay]
  );

  return (
    <Line
      points={points}
      color={color}
      transparent
      opacity={opacity}
      lineWidth={1.5}
      dashed
      dashSize={0.05}
      gapSize={0.03}
    />
  );
}
