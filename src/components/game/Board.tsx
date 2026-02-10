import React from 'react';
import { useGameStore } from '@/store/useGameStore';
export function Board() {
  const gridSize = useGameStore(s => s.gridSize);
  const offset = gridSize / 2 - 0.5;
  return (
    <group>
      {/* Playable Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial color="#86EFAC" />
      </mesh>
      {/* Grid Pattern */}
      {Array.from({ length: gridSize }).map((_, x) =>
        Array.from({ length: gridSize }).map((_, z) => {
          if ((x + z) % 2 === 0) return null;
          return (
            <mesh 
              key={`${x}-${z}`} 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[x - offset, 0, z - offset]}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color="#4ADE80" transparent opacity={0.3} />
            </mesh>
          );
        })
      )}
      {/* Decorative Border */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[gridSize + 0.5, 0.2, gridSize + 0.5]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
    </group>
  );
}