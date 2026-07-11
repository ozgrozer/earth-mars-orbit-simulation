"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface RocketProps {
  position: [number, number, number];
  lookAt?: [number, number, number] | null;
  active: boolean;
  arrived: boolean;
  missed: boolean;
}

/**
 * Procedural SpaceX Starship (Ship) — stainless body, nose, flaps, Raptors.
 * Local +Z is nose (forward); engines point −Z. lookAt orients the group.
 */
function StarshipModel({
  engineLit,
  statusColor,
}: {
  engineLit: boolean;
  statusColor: string;
}) {
  const steel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c5c9ce",
        metalness: 0.92,
        roughness: 0.28,
        envMapIntensity: 1.2,
      }),
    []
  );
  const steelDark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8b9199",
        metalness: 0.88,
        roughness: 0.35,
      }),
    []
  );
  const blackTile = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1a1c",
        metalness: 0.15,
        roughness: 0.85,
      }),
    []
  );
  const flapMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#a8adb4",
        metalness: 0.85,
        roughness: 0.32,
        side: THREE.DoubleSide,
      }),
    []
  );
  const raptorBell = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4a5568",
        metalness: 0.7,
        roughness: 0.4,
      }),
    []
  );

  // Scene scale: ship length ~0.11 units
  const R = 0.014; // body radius
  const bodyLen = 0.055;
  const noseLen = 0.028;

  return (
    <group>
      {/* Main stainless barrel */}
      <mesh material={steel} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[R, R, bodyLen, 24]} />
      </mesh>

      {/* Heat-shield belly strip (windward black tiles) */}
      <mesh
        material={blackTile}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, -R * 0.55, 0]}
        scale={[0.55, 1, 0.35]}
      >
        <cylinderGeometry args={[R * 1.02, R * 1.02, bodyLen * 0.95, 16, 1, true]} />
      </mesh>

      {/* Nose cone */}
      <mesh
        material={steel}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, bodyLen / 2 + noseLen / 2 - 0.002]}
      >
        <coneGeometry args={[R, noseLen, 24]} />
      </mesh>

      {/* Dark nose tip */}
      <mesh
        material={blackTile}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, bodyLen / 2 + noseLen - 0.004]}
      >
        <coneGeometry args={[R * 0.35, noseLen * 0.22, 12]} />
      </mesh>

      {/* Forward flaps (canards) — near nose, left/right */}
      {[1, -1].map((side) => (
        <mesh
          key={`fwd-${side}`}
          material={flapMat}
          position={[side * R * 0.95, 0, bodyLen * 0.28]}
          rotation={[0.15, 0, side * 0.35]}
        >
          <boxGeometry args={[0.022, 0.0025, 0.018]} />
        </mesh>
      ))}

      {/* Aft flaps — larger, near base */}
      {[1, -1].map((side) => (
        <mesh
          key={`aft-${side}`}
          material={flapMat}
          position={[side * R * 1.05, -R * 0.15, -bodyLen * 0.28]}
          rotation={[-0.25, 0, side * 0.2]}
        >
          <boxGeometry args={[0.032, 0.0028, 0.028]} />
        </mesh>
      ))}

      {/* Chine / ring detail */}
      <mesh material={steelDark} position={[0, 0, bodyLen * 0.15]}>
        <torusGeometry args={[R * 1.02, 0.0012, 8, 24]} />
      </mesh>
      <mesh material={steelDark} position={[0, 0, -bodyLen * 0.2]}>
        <torusGeometry args={[R * 1.02, 0.0012, 8, 24]} />
      </mesh>

      {/* Raptor engine cluster (3 sea-level style bells) */}
      {[
        [0, 0],
        [0.007, 0.006],
        [-0.007, 0.006],
      ].map(([x, y], i) => (
        <mesh
          key={`raptor-${i}`}
          material={raptorBell}
          position={[x, y, -bodyLen / 2 - 0.008]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.0035, 0.0065, 0.014, 10]} />
        </mesh>
      ))}

      {/* Engine plume when in transit */}
      {engineLit && (
        <group position={[0, 0, -bodyLen / 2 - 0.02]}>
          <mesh>
            <coneGeometry args={[0.01, 0.04, 12]} />
            <meshBasicMaterial
              color="#60a5fa"
              transparent
              opacity={0.55}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0, -0.012]} scale={[0.7, 0.7, 1.2]}>
            <coneGeometry args={[0.01, 0.035, 12]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.4}
              depthWrite={false}
            />
          </mesh>
          <pointLight color="#93c5fd" intensity={0.35} distance={0.4} />
        </group>
      )}

      {/* Soft status glow so it stays readable at distance */}
      <mesh scale={1.15}>
        <sphereGeometry args={[R * 1.4, 12, 12]} />
        <meshBasicMaterial
          color={statusColor}
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function Rocket({
  position,
  lookAt,
  active,
  arrived,
  missed,
}: RocketProps) {
  const group = useRef<THREE.Group>(null);

  const trailGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const n = 48;
    const positions = new Float32Array(n * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geo, n, positions };
  }, []);

  const history = useRef<[number, number, number][]>([]);

  useFrame(() => {
    if (!active) {
      history.current = [];
      return;
    }

    // Clear trail after loop/jump so we don't draw a line across the solar system
    const prev = history.current[history.current.length - 1];
    if (prev) {
      const dx = position[0] - prev[0];
      const dy = position[1] - prev[1];
      const dz = position[2] - prev[2];
      if (dx * dx + dy * dy + dz * dz > 0.08) {
        history.current = [];
      }
    }

    history.current.push([position[0], position[1], position[2]]);
    if (history.current.length > trailGeo.n) history.current.shift();

    const arr = trailGeo.positions;
    for (let i = 0; i < trailGeo.n; i++) {
      const p = history.current[i] ?? position;
      arr[i * 3] = p[0];
      arr[i * 3 + 1] = p[1];
      arr[i * 3 + 2] = p[2];
    }
    trailGeo.geo.attributes.position.needsUpdate = true;

    if (group.current && lookAt) {
      const target = new THREE.Vector3(lookAt[0], lookAt[1], lookAt[2]);
      group.current.lookAt(target);
    }
  });

  if (!active) return null;

  const statusColor = missed ? "#f87171" : arrived ? "#4ade80" : "#fbbf24";
  const statusLabel = missed
    ? "Missed — still coasting"
    : arrived
      ? "Arrived!"
      : "Starship in transit";
  // Engines idle after the transfer burn; coasting continues either way
  const engineLit = !arrived && !missed;

  return (
    <group>
      <points geometry={trailGeo.geo}>
        <pointsMaterial
          color="#93c5fd"
          size={0.024}
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      <group ref={group} position={position} scale={1.15}>
        <StarshipModel engineLit={engineLit} statusColor={statusColor} />
      </group>

      <Html
        position={[position[0], position[1] + 0.14, position[2]]}
        center
        style={{
          pointerEvents: "none",
          whiteSpace: "nowrap",
          color: statusColor,
          fontSize: "11px",
          fontWeight: 600,
          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
        }}
        distanceFactor={6}
      >
        {statusLabel}
      </Html>
    </group>
  );
}
