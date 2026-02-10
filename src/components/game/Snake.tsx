import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RoundedBox } from '@react-three/drei';
export function Snake() {
  const snake = useGameStore(s => s.snake);
  const gridSize = useGameStore(s => s.gridSize);
  // Offset to center the grid on [0,0]
  const offset = gridSize / 2 - 0.5;
  return (
    <group>
      {snake.map((segment, i) => (
        <RoundedBox
          key={`${i}-${segment[0]}-${segment[1]}`}
          args={[0.9, 0.9, 0.9]}
          radius={0.2}
          smoothness={4}
          position={[segment[0] - offset, 0.5, segment[1] - offset]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial 
            color={i === 0 ? "#FF6B6B" : "#4D96FF"} 
            roughness={0.3} 
            metalness={0.2}
          />
        </RoundedBox>
      ))}
    </group>
  );
}