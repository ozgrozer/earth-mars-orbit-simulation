"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { SolarSystem } from "./SolarSystem";
import { useSimulation } from "@/store/simulation";

export function SceneCanvas() {
  const panelOpen = useSimulation((s) => s.panelOpen);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Shift solar system left when the right panel is open so it sits in the free space */}
      <div
        className={`absolute inset-0 transition-transform duration-300 ease-out ${
          panelOpen
            ? "-translate-x-[11%] sm:-translate-x-[13%]"
            : "translate-x-0"
        }`}
      >
        <Canvas
          camera={{ position: [0, 3.2, 2.8], fov: 45, near: 0.01, far: 100 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <SolarSystem />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
