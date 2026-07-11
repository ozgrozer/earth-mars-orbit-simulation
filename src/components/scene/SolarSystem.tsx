"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import {
  EARTH_ORBIT_AU,
  MARS_ORBIT_AU,
  TRANSFER_DAYS,
  earthAngleAt,
  marsAngleAt,
  planetPosition,
  transferPosition,
} from "@/lib/orbital";
import { getLaunchDay, useSimulation } from "@/store/simulation";
import { Sun } from "./Sun";
import { Planet } from "./Planet";
import { OrbitRing } from "./OrbitRing";
import { Rocket } from "./Rocket";
import { TransferPathDashed } from "./TransferPath";
import { PhaseAngleArc } from "./PhaseAngleArc";
import { Stars } from "./Stars";

export function SolarSystem() {
  const timeDays = useSimulation((s) => s.timeDays);
  const scenarioId = useSimulation((s) => s.scenarioId);
  const showPath = useSimulation((s) => s.showPath);
  const showPhaseAngle = useSimulation((s) => s.showPhaseAngle);
  const tick = useSimulation((s) => s.tick);

  const launchDay = getLaunchDay(scenarioId);

  const earthAngle = earthAngleAt(timeDays);
  const marsAngle = marsAngleAt(timeDays);
  const earthPos = planetPosition(EARTH_ORBIT_AU, earthAngle);
  const marsPos = planetPosition(MARS_ORBIT_AU, marsAngle);

  const inTransit =
    launchDay !== null &&
    timeDays >= launchDay &&
    timeDays < launchDay + TRANSFER_DAYS;

  const postArrival =
    launchDay !== null && timeDays >= launchDay + TRANSFER_DAYS;

  // Optimal: capture at Mars after intercept.
  // Miss: keep coasting on the transfer ellipse (no freeze).
  let rocketPos: [number, number, number] | null = null;
  if (launchDay !== null && timeDays >= launchDay) {
    if (scenarioId === "optimal" && postArrival) {
      rocketPos = marsPos;
    } else {
      rocketPos = transferPosition(timeDays, launchDay);
    }
  }

  const nextRocketPos =
    launchDay !== null &&
    timeDays >= launchDay &&
    !(scenarioId === "optimal" && postArrival)
      ? transferPosition(timeDays + 0.5, launchDay)
      : null;

  const arrived = postArrival && scenarioId === "optimal";
  const missed = postArrival && scenarioId === "one-year-late";
  const rocketActive = rocketPos !== null;

  const arrivalMarker = useMemo(() => {
    if (launchDay === null) return null;
    return transferPosition(launchDay + TRANSFER_DAYS, launchDay);
  }, [launchDay]);

  useFrame((_, delta) => {
    tick(Math.min(delta, 0.05));
  });

  const marsAtArrival =
    launchDay !== null
      ? planetPosition(MARS_ORBIT_AU, marsAngleAt(launchDay + TRANSFER_DAYS))
      : null;

  const showArrivalGhost =
    launchDay !== null &&
    scenarioId === "one-year-late" &&
    timeDays >= launchDay + TRANSFER_DAYS * 0.85;

  const missLinePoints =
    missed && rocketPos
      ? [
          rocketPos as [number, number, number],
          marsPos as [number, number, number],
        ]
      : null;

  return (
    <>
      <color attach="background" args={["#030712"]} />
      <ambientLight intensity={0.22} />
      <Stars />

      <Sun />

      <OrbitRing radius={EARTH_ORBIT_AU} color="#38bdf8" opacity={0.35} />
      <OrbitRing radius={MARS_ORBIT_AU} color="#fb923c" opacity={0.35} />

      <Planet
        position={earthPos}
        radius={0.055}
        color="#3b82f6"
        emissive="#1d4ed8"
        label="Earth"
        labelColor="#7dd3fc"
      />
      <Planet
        position={marsPos}
        radius={0.04}
        color="#ef4444"
        emissive="#b91c1c"
        label="Mars"
        labelColor="#fdba74"
      />

      {showPhaseAngle && (
        <PhaseAngleArc
          earthAngle={earthAngle}
          marsAngle={marsAngle}
          visible
        />
      )}

      {showPath && launchDay !== null && (
        <TransferPathDashed
          launchDay={launchDay}
          color={scenarioId === "optimal" ? "#fbbf24" : "#f87171"}
          opacity={0.65}
        />
      )}

      {arrivalMarker && showPath && (
        <mesh position={arrivalMarker} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.04, 0.055, 24]} />
          <meshBasicMaterial
            color={scenarioId === "optimal" ? "#4ade80" : "#f87171"}
            side={2}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {showArrivalGhost && marsAtArrival && (
        <mesh position={marsAtArrival}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.25} />
        </mesh>
      )}

      {rocketPos && (
        <Rocket
          position={rocketPos}
          lookAt={nextRocketPos}
          active={!!rocketActive || arrived || missed}
          arrived={arrived}
          missed={missed}
        />
      )}

      {missLinePoints && (
        <Line
          points={missLinePoints}
          color="#f87171"
          lineWidth={1.5}
          transparent
          opacity={0.75}
        />
      )}

      <OrbitControls
        enablePan
        enableZoom
        zoomSpeed={0.28}
        rotateSpeed={0.55}
        panSpeed={0.4}
        minDistance={1.2}
        maxDistance={8}
        maxPolarAngle={Math.PI * 0.48}
        minPolarAngle={0.15}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.08}
        // Only handle events that hit the canvas, not the HTML overlay
        makeDefault
      />
    </>
  );
}
