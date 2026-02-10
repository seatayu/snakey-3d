import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/useGameStore';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
export function Food() {
  const food = useGameStore(s => s.food);
  const gridSize = useGameStore(s => s.gridSize);
  const meshRef = useRef<THREE.Mesh>(null);
  const offset = gridSize / 2 - 0.5;
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.getElapsedTime() * 3) * 0.2;
      meshRef.current.rotation.y += 0.05;
    }
  });
  return (
    <Sphere
      ref={meshRef}
      args={[0.4, 32, 32]}
      position={[food[0] - offset, 0.5, food[1] - offset]}
      castShadow
    >
      <MeshDistortMaterial
        color="#FFD93D"
        speed={4}
        distort={0.4}
        radius={1}
      />
    </Sphere>
  );
}