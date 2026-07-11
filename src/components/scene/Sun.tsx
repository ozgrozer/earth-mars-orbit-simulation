"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

export function Sun() {
  const glowRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 0.8) * 0.04;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshBasicMaterial color="#ffcc33" />
      </mesh>
      <mesh ref={glowRef} scale={1.8}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshBasicMaterial
          color="#ff9900"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={3.2}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
      <pointLight color="#fff2cc" intensity={2.2} distance={12} decay={1.5} />
      <pointLight color="#ffaa44" intensity={0.6} distance={20} decay={2} />
    </group>
  );
}
